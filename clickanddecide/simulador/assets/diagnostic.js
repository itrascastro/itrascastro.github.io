/* ---------------------------------------------------------------------------
   Corrector.

   Compara la consulta que heu construit amb la solucio de l'exercici i, quan
   no coincideixen, diu TRES coses:

     1. que heu fet
     2. per que esta malament
     3. com hauria de quedar

   No es limita a comparar el nombre de registres: mira la consulta per dins.
   Dues consultes poden donar la mateixa xifra per motius diferents, i una
   consulta pot ser correcta encara que no sigui identica a la solucio.
   --------------------------------------------------------------------------- */

const Diagnostic = (function () {
  'use strict';

  /* Ordre de gravetat: primer el que invalida la consulta sencera. */
  var GRAVETAT = { greu: 0, mitja: 1, suau: 2 };

  function corregeix(consulta, exercici) {
    var sol = exercici.solucio;
    var avisos = [];

    /* Els exercicis de parametres es corregeixen executant les dues consultes
       amb el MATEIX valor. Si no, la comparacio no voldria dir res: qui
       practica hauria pogut respondre qualsevol cosa a la finestra. */
    var ambValors = valorsDeProva(consulta, sol);
    var meu = Motor.executa(ambValors.meva);
    var seu = Motor.executa(ambValors.bona);

    /* --- Les taules ------------------------------------------------------
       Mentre les taules no siguin les bones, la resta de la comparacio no diu
       res util: els camps ni tan sols existeixen. Per aixo s'atura aqui. */
    var avisTaules = comparaTaules(consulta, sol);
    if (avisTaules) return tanca(avisos.concat([avisTaules]), meu, seu, false);

    /* --- Els enllacos ------------------------------------------------------ */
    avisos = avisos.concat(comparaEnllacos(consulta, sol));
    if (avisos.some(function (a) { return a.gravetat === 'greu'; })) {
      return tanca(avisos, meu, seu, false);
    }

    /* --- Els criteris ---------------------------------------------------- */
    avisos = avisos.concat(comparaCriteris(consulta, sol, exercici));

    /* --- Els parametres ---------------------------------------------------- */
    avisos = avisos.concat(comparaParametres(consulta, sol));

    /* --- Els parentesis --------------------------------------------------- */
    var avisParentesi = comprovaParentesis(consulta, sol);
    if (avisParentesi) avisos.push(avisParentesi);

    /* --- El comptador ----------------------------------------------------- */
    avisos = avisos.concat(comparaAgregats(consulta, sol));

    /* --- L'ordenacio -------------------------------------------------------- */
    var avisOrdre = comparaOrdenacio(consulta, sol);
    if (avisOrdre) avisos.push(avisOrdre);

    /* --- Registres unics --------------------------------------------------- */
    if (sol.consulta.registresUnics && !consulta.registresUnics) {
      avisos.push({
        gravetat: 'mitja',
        titol: 'Falta activar els registres unics',
        heuFet: 'La consulta torna cada valor tantes vegades com apareix.',
        perque: 'L\'encarrec demana quins valors existeixen, no quantes vegades surt cadascun. Sense la propietat, obteniu una fila per registre.',
        aixi: 'Boto <b>Propietats de la consulta</b> i poseu <b>Registres unics</b> a Si.',
        unitat: '11'
      });
    }

    /* --- Els camps mostrats -------------------------------------------------
       Ensenyar camps de mes no vol dir que la consulta estigui mal plantejada:
       els criteris poden ser exactament els bons. Es diu, pero no es tomba la
       resposta per aixo. */
    var camps = comparaCamps(consulta, sol);
    avisos = avisos.concat(camps.avisos);

    /* --- El resultat -------------------------------------------------------
       Es compara el contingut, no nomes el nombre de files: dues consultes amb
       agregats poden tornar una sola fila cadascuna i xifres diferents. Si
       nomes sobren columnes, es compara el que si que s'ha demanat. */
    var meuComparable = camps.nomesSobren
      ? Motor.executa(Object.assign({}, camps.projectada,
          { valorsParametres: ambValors.meva.valorsParametres }))
      : meu;
    var mateixResultat = igualtatDeResultats(meuComparable, seu, (sol.consulta.ordre || []).length > 0);
    var encerta = mateixResultat && !avisos.some(function (a) {
      return a.gravetat !== 'suau';
    });

    if (!encerta && !avisos.length) {
      avisos.push({
        gravetat: 'mitja',
        titol: 'El resultat no coincideix',
        heuFet: descriuResultat(meu),
        perque: meu.registres === seu.registres
          ? 'En sortiu el mateix nombre, pero <b>no son els mateixos</b>. Passa quan el criteri ' +
            'selecciona un conjunt diferent que casualment te la mateixa mida, o quan les columnes ' +
            'que ensenyeu no son les de l\'encarrec.'
          : meu.registres > seu.registres
            ? 'N\'obteniu <b>mes</b> dels que toca: falta algun criteri, o algun criteri deixa passar mes registres dels que hauria.'
            : 'N\'obteniu <b>menys</b> dels que toca: hi ha algun criteri de mes, o un valor massa restrictiu.',
        aixi: 'Hauria de donar ' + descriuResultat(seu, true) + '.',
        unitat: exercici.unitat
      });
    }

    return tanca(avisos, meu, seu, encerta);
  }

  function tanca(avisos, meu, seu, encerta) {
    avisos.sort(function (a, b) { return GRAVETAT[a.gravetat] - GRAVETAT[b.gravetat]; });
    return {
      encerta: encerta,
      registresMeus: meu.registres,
      registresBons: seu.registres,
      errorMotor: meu.error || null,
      avisos: avisos
    };
  }

  /* --- Taules i enllacos ---------------------------------------------------
     Una consulta pot fallar molt abans dels criteris: per treballar sobre la
     taula que no toca, per haver-ne agafat una de mes, o per enllaçar-les
     malament. Son els errors que costen mes de veure, perque la consulta
     s'executa igualment i torna una xifra amb bona pinta.
     ---------------------------------------------------------------------- */

  function taulesDe(c) {
    if (c.taules && c.taules.length) return c.taules.slice();
    return c.taula ? [c.taula] : [];
  }

  function comparaTaules(consulta, sol) {
    var meves = taulesDe(consulta), bones = taulesDe(sol.consulta);
    var falten = bones.filter(function (t) { return meves.indexOf(t) === -1; });
    var sobren = meves.filter(function (t) { return bones.indexOf(t) === -1; });
    if (!falten.length && !sobren.length) return null;

    /* Cas classic d'una sola taula per banda: es una equivocacio de taula. */
    if (meves.length === 1 && bones.length === 1) {
      return {
        gravetat: 'greu',
        titol: 'Taula equivocada',
        heuFet: 'Heu fet la consulta sobre <code>' + (meves[0] || 'cap taula') + '</code>.',
        perque: explicaTaula(meves[0], bones[0]),
        aixi: 'La taula d\'aquest encarrec es <code>' + bones[0] + '</code>.',
        unitat: '00'
      };
    }

    if (falten.length) {
      return {
        gravetat: 'greu',
        titol: bones.length > 1 ? 'Falta una taula' : 'Taula equivocada',
        heuFet: meves.length
          ? 'Heu triat nomes <code>' + meves.join('</code> i <code>') + '</code>.'
          : 'No heu triat cap taula.',
        perque: 'La pregunta demana dades que <code>' + falten[0] + '</code> es l\'unica que te. ' +
                explicaTaula(null, falten[0]) + ' Cap consulta pot mostrar un camp d\'una taula que no ha seleccionat.',
        aixi: 'Afegiu <code>' + falten.join('</code> i <code>') + '</code> i enllaceu-les.',
        unitat: '00'
      };
    }

    return {
      gravetat: 'greu',
      titol: 'Una taula de mes',
      heuFet: 'Heu afegit <code>' + sobren.join('</code> i <code>') + '</code>.',
      perque: 'Una taula de mes no es innocent: obliga a un enllaç, i cada enllaç pot multiplicar o perdre files. ' +
              'Si la pregunta es respon amb ' + (bones.length > 1 ? 'les altres' : '<code>' + bones[0] + '</code>') + ', sobra.',
      aixi: 'Deixeu nomes <code>' + bones.join('</code> i <code>') + '</code>.',
      unitat: '00'
    };
  }

  function textEnllac(e) {
    return e.taulaA + '.' + e.campA + ' &rarr; ' + e.taulaB + '.' + e.campB;
  }

  /* Dos enllacos son el mateix encara que estiguin escrits al reves. */
  function mateixParell(a, b) {
    var x = [a.taulaA + '.' + a.campA, a.taulaB + '.' + a.campB].sort().join('|');
    var y = [b.taulaA + '.' + b.campA, b.taulaB + '.' + b.campB].sort().join('|');
    return x === y;
  }

  function comparaEnllacos(consulta, sol) {
    var avisos = [];
    var meus = consulta.enllacos || [], bons = sol.consulta.enllacos || [];
    if (!bons.length) return avisos;

    bons.forEach(function (bo) {
      var igual = meus.filter(function (m) { return mateixParell(m, bo); })[0];

      if (!igual) {
        /* Ha enllaçat les mateixes taules per uns altres camps? */
        var altre = meus.filter(function (m) {
          return [m.taulaA, m.taulaB].sort().join('|') === [bo.taulaA, bo.taulaB].sort().join('|');
        })[0];

        avisos.push(altre ? {
          gravetat: 'greu',
          titol: 'Enllaç pels camps equivocats',
          heuFet: 'Heu enllaçat <code>' + textEnllac(altre) + '</code>.',
          perque: 'L\'enllaç nomes te sentit entre camps que contenen <b>la mateixa cosa</b>. Si els valors dels dos ' +
                  'camps no son del mateix domini, no casa mai cap fila i la consulta torna zero registres; si casen ' +
                  'per casualitat, el resultat es fals i ningu us avisa.',
          aixi: 'L\'enllaç bo es <code>' + textEnllac(bo) + '</code>.',
          unitat: '00'
        } : {
          gravetat: 'greu',
          titol: 'Falta l\'enllaç entre les dues taules',
          heuFet: 'Heu seleccionat les dues taules pero no les heu unides.',
          perque: 'Sense enllaç, cada fila d\'una taula es combinaria amb <b>totes</b> les de l\'altra: no una xifra ' +
                  'una mica desviada, sino milers de files que no volen dir res. Per aixo aqui la consulta s\'atura ' +
                  'i us ho diu, en comptes de tornar-vos el disbarat.',
          aixi: 'Enllaceu <code>' + textEnllac(bo) + '</code>.',
          unitat: '00'
        });
        return;
      }

      if (igual.tipus !== bo.tipus) {
        avisos.push(bo.tipus === 'totes-esq' ? {
          gravetat: 'greu',
          titol: 'L\'enllaç ha de conservar totes les de la primera taula',
          heuFet: 'Heu fet servir l\'enllaç de <b>coincidents</b>.',
          perque: 'Amb coincidents, les files de la primera taula que no troben parella <b>desapareixen del ' +
                  'resultat sense deixar rastre</b>. I justament son aquestes les que busca l\'encarrec: si les ' +
                  'elimineu, la consulta no pot trobar-les mai.',
          aixi: 'Poseu l\'enllaç de tipus <b>totes les de ' + bo.taulaA + '</b>. Despres, les files sense parella ' +
                'es reconeixen perque els camps de l\'altra taula queden buits.',
          unitat: '00'
        } : {
          gravetat: 'mitja',
          titol: 'L\'enllaç deixa passar files sense parella',
          heuFet: 'Heu fet servir l\'enllaç de <b>totes les de ' + igual.taulaA + '</b>.',
          perque: 'Aquest enllaç conserva les files que no casen amb res, i els camps de l\'altra taula hi surten ' +
                  'buits. L\'encarrec demana nomes les que tenen parella de veritat, de manera que aquestes files ' +
                  'buides inflen el recompte.',
          aixi: 'Poseu l\'enllaç de tipus <b>coincidents</b>.',
          unitat: '00'
        });
      }
    });

    /* Enllacos que sobren */
    meus.forEach(function (m) {
      if (bons.some(function (bo) { return mateixParell(m, bo); })) return;
      if (bons.some(function (bo) {
        return [m.taulaA, m.taulaB].sort().join('|') === [bo.taulaA, bo.taulaB].sort().join('|');
      })) return;
      avisos.push({
        gravetat: 'mitja',
        titol: 'Un enllaç de mes',
        heuFet: 'Heu definit <code>' + textEnllac(m) + '</code>.',
        perque: 'Cada enllaç afegeix una condicio d\'unio. Un que la pregunta no demana nomes pot fer una cosa: ' +
                'treure files del resultat.',
        aixi: 'Deixeu nomes els enllacos que la pregunta necessita.',
        unitat: '00'
      });
    });

    return avisos;
  }

  /* Quins camps s'ensenyen. La comparacio es fa pel nom curt: amb una sola
     taula els camps no porten el nom de la taula al davant. */
  function comparaCamps(consulta, sol) {
    var avisos = [];
    var meus = (consulta.camps || []).filter(function (c) { return !c.ocult; });
    var bons = (sol.consulta.camps || []).filter(function (c) { return !c.ocult; });
    var nomsBons = bons.map(function (c) { return nomCurtCamp(c.nom); });
    var nomsMeus = meus.map(function (c) { return nomCurtCamp(c.nom); });

    var falten = bons.filter(function (c) { return nomsMeus.indexOf(nomCurtCamp(c.nom)) === -1; });
    var sobren = meus.filter(function (c) { return nomsBons.indexOf(nomCurtCamp(c.nom)) === -1; });

    if (falten.length) {
      avisos.push({
        gravetat: 'mitja',
        titol: falten.length > 1 ? 'Falten camps al resultat' : 'Falta un camp al resultat',
        heuFet: meus.length
          ? 'Ensenyeu <code>' + nomsMeus.join('</code>, <code>') + '</code>.'
          : 'No heu marcat cap camp.',
        perque: 'L\'encarrec diu quins camps vol veure. Un llistat que no els porta no respon la ' +
                'pregunta, encara que el filtratge sigui correcte.',
        aixi: 'Marqueu <code>' + falten.map(function (c) { return nomCurtCamp(c.nom); }).join('</code> i <code>') +
              '</code> a la <b>tercera</b> columna, la de les ulleres.',
        unitat: '04'
      });
    }

    if (sobren.length) {
      avisos.push({
        gravetat: 'suau',
        titol: sobren.length > 1 ? 'Ensenyeu camps de mes' : 'Ensenyeu un camp de mes',
        heuFet: 'Al resultat hi surt tambe <code>' + sobren.map(function (c) { return nomCurtCamp(c.nom); }).join('</code> i <code>') + '</code>.',
        perque: 'No es cap error de plantejament i el filtratge no en queda afectat, pero l\'encarrec ' +
                'demanava nomes ' + nomsBons.map(function (n) { return '<code>' + n + '</code>'; }).join(' i ') +
                '. En una extraccio de debo, les columnes de mes son les que fan que despres ningu ' +
                's\'entengui amb el fitxer.',
        aixi: 'Desmarqueu-lo a la columna de les ulleres, o deixeu-lo si el voleu per mirar les dades.',
        unitat: '04'
      });
    }

    var projectada = null;
    if (!falten.length && sobren.length) {
      projectada = JSON.parse(JSON.stringify(consulta));
      projectada.camps = meus.filter(function (c) { return nomsBons.indexOf(nomCurtCamp(c.nom)) !== -1; });
    }

    return { avisos: avisos, nomesSobren: !!projectada, projectada: projectada };
  }

  /* L'ordenacio no canvia quins registres surten, nomes en quin ordre. Per
     aixo el comptador coincideix i sembla que tot vagi be. */
  function comparaOrdenacio(consulta, sol) {
    var bons = sol.consulta.ordre || [], meus = consulta.ordre || [];
    if (!bons.length) return null;

    var bo = bons[0];
    var meu = meus.filter(function (o) { return nomCurtCamp(o.camp) === nomCurtCamp(bo.camp); })[0];

    if (!meus.length) {
      return {
        gravetat: 'mitja',
        titol: 'Falta ordenar el resultat',
        heuFet: 'El llistat surt sense ordenar.',
        perque: 'Sense ordenacio els registres surten en l\'ordre en que la taula els guarda, que no ' +
                'vol dir res i canvia amb el temps. El comptador coincideix igualment, i per aixo ' +
                'aquest error passa desapercebut.',
        aixi: 'A la <b>segona</b> columna, la de les ratlletes, feu clic sobre <code>' + bo.camp +
              '</code>' + (bo.sentit === 'desc' ? ' dues vegades, per posar-lo de gran a petit.' : '.'),
        unitat: '05'
      };
    }
    if (!meu) {
      return {
        gravetat: 'mitja',
        titol: 'Ordenat pel camp equivocat',
        heuFet: 'Heu ordenat per <code>' + meus[0].camp + '</code>.',
        perque: 'L\'encarrec demana l\'ordre per un altre camp, i amb aquest el llistat no respon la pregunta.',
        aixi: 'Ordeneu per <code>' + bo.camp + '</code>.',
        unitat: '05'
      };
    }
    if ((meu.sentit || 'asc') !== (bo.sentit || 'asc')) {
      return {
        gravetat: 'mitja',
        titol: 'Ordenat al reves',
        heuFet: 'Heu ordenat de ' + (meu.sentit === 'desc' ? 'gran a petit' : 'petit a gran') + '.',
        perque: 'L\'encarrec demana el sentit contrari. Amb un llistat llarg, el que interessa acostuma ' +
                'a ser el que queda a dalt de tot.',
        aixi: 'Torneu a fer clic a la columna de les ratlletes per capgirar el sentit.',
        unitat: '05'
      };
    }
    return null;
  }

  function nomCurtCamp(n) {
    var i = String(n).indexOf('.');
    return i === -1 ? n : n.slice(i + 1);
  }

  function explicaTaula(meva, bona) {
    var raons = {
      'WAIV9010_PERSONA': 'te una fila per persona i serveix per a preguntes sobre gent, a data d\'avui',
      'WAIV9080_LLOC': 'te una fila per lloc de treball i no guarda historic',
      'WAIV9060_INCIDENCI': 'te una fila per incidencia, amb dates d\'inici i fi',
      'WAIV9030_PUNTERH': 'es l\'unica que guarda l\'historic de la relacio persona-lloc'
    };
    var t = 'La taula <code>' + bona + '</code> ' + (raons[bona] || '') + '.';
    if (meva && raons[meva]) {
      t += ' La que heu triat ' + raons[meva] + ', i per aixo no pot respondre aquesta pregunta.';
    }
    return t;
  }

  /* --- Criteris -----------------------------------------------------------
     Es comparen per camp. Per a cada camp que la solucio filtra, es mira si
     l'usuari l'ha filtrat, amb quin operador i amb quins valors.
     -------------------------------------------------------------------- */

  /* --- Parametres -----------------------------------------------------------
     Un exercici de parametres no demana un valor concret: demana que la
     consulta el pregunti. Per poder comparar resultats, totes dues consultes
     s'executen amb els valors de prova que porta l'exercici; els de qui
     practica es fan correspondre pel CAMP, no pel nom que hi hagi posat, que
     es lliure.
     ---------------------------------------------------------------------- */

  function valorsDeProva(consulta, sol) {
    var prova = sol.parametres || null;
    if (!prova) return { meva: consulta, bona: sol.consulta };

    var seus = {};
    (sol.consulta.criteris || []).forEach(function (c) {
      if (c.parametre) seus[c.camp] = c.parametre;
    });

    var meus = {};
    (consulta.criteris || []).forEach(function (c) {
      if (!c.parametre) return;
      var equivalent = seus[c.camp];
      var valor = prova[c.parametre] || (equivalent ? prova[equivalent] : null);
      /* Si el camp no es cap dels previstos, s'hi posa el primer valor de
         prova: aixi la consulta s'executa i el diagnostic pot parlar del
         resultat en comptes de morir dient que falta un valor. */
      if (!valor) valor = prova[Object.keys(prova)[0]];
      meus[c.parametre] = valor;
    });

    return {
      meva: Object.assign({}, consulta, { valorsParametres: meus }),
      bona: Object.assign({}, sol.consulta, { valorsParametres: prova })
    };
  }

  function comparaParametres(consulta, sol) {
    var avisos = [];
    var meus = consulta.criteris || [];
    var bons = sol.consulta.criteris || [];

    bons.forEach(function (b) {
      if (!b.parametre) return;
      var meu = meus.filter(function (c) { return c.camp === b.camp; })[0];
      if (!meu) return;                       // ja ho dira comparaCriteris
      if (!meu.parametre) {
        avisos.push({
          gravetat: 'greu',
          titol: 'Aquest criteri ha de ser un parametre',
          heuFet: 'Heu escrit el valor a dins del criteri: <code>' + textCriteri(meu) + '</code>.',
          perque: 'Amb el valor escrit, la consulta nomes serveix per a aquest valor. ' +
                  'L\'encarrec demana una consulta que serveixi per a qualsevol: la que pregunta ' +
                  'el valor cada vegada que s\'executa.',
          aixi: 'Obriu <b>Criteris</b>, trieu el criteri de <code>' + nomCurtCamp(b.camp) +
                '</code> i premeu <b>Paràmetres...</b>. Poseu-hi el nom <code>' + b.parametre +
                '</code> i el text de la pregunta.',
          unitat: '16'
        });
      }
    });

    meus.forEach(function (c) {
      if (!c.parametre) return;
      var b = bons.filter(function (x) { return x.camp === c.camp; })[0];
      if (b && !b.parametre) {
        avisos.push({
          gravetat: 'mitja',
          titol: 'Aquest criteri no havia de ser un parametre',
          heuFet: 'Heu fet que <code>' + nomCurtCamp(c.camp) + '</code> pregunti el valor.',
          perque: 'L\'encarrec fixa aquest valor: ha d\'anar escrit al criteri, no preguntat.',
          aixi: 'Al mateix boto <b>Paràmetres...</b> hi ha <b>Torna a un valor fix</b>.',
          unitat: '16'
        });
      }
    });

    return avisos;
  }

  function comparaCriteris(consulta, sol, exercici) {
    var avisos = [];
    var meus = consulta.criteris || [];
    var bons = sol.consulta.criteris || [];

    var campsBons = unics(bons.map(function (c) { return c.camp; }));
    var campsMeus = unics(meus.map(function (c) { return c.camp; }));

    /* Criteris que falten */
    campsBons.forEach(function (nomCamp) {
      if (campsMeus.indexOf(nomCamp) !== -1) return;

      /* Potser ha filtrat pel camp de descripcio equivalent */
      var bessó = campDescripcio(nomCamp, consulta);
      if (bessó && campsMeus.indexOf(bessó) !== -1) {
        avisos.push({
          gravetat: 'mitja',
          titol: 'Heu filtrat per la descripcio, no pel codi',
          heuFet: 'Heu posat el criteri sobre <code>' + bessó + '</code>.',
          perque: 'Els camps de descripcio son text lliure: porten accents, apostrofs i espais de farciment, i qualsevol d\'aquestes tres coses fa que la consulta torni zero registres sense avisar.',
          aixi: 'Poseu el criteri sobre <code>' + nomCamp + '</code>, que conte codis curts i tancats.',
          unitat: '06'
        });
        return;
      }

      var b = bons.filter(function (c) { return c.camp === nomCamp; });
      avisos.push({
        gravetat: 'greu',
        titol: 'Falta un criteri',
        heuFet: 'No heu filtrat pel camp <code>' + nomCamp + '</code>.',
        perque: raoDelCriteri(nomCamp, exercici),
        aixi: 'Afegiu-hi: <code>' + textCriteri(b[0]) + '</code>' +
              (b.length > 1 ? ' i la seva segona condicio.' : '') + (function () {
                var llista = cataleg(consulta, nomCamp);
                return llista ? '<br>Valors possibles del camp:<br><span class="cataleg">' +
                                textCataleg(llista) + '</span>' : '';
              })(),
        unitat: exercici.unitat
      });
    });

    /* Criteris que sobren */
    campsMeus.forEach(function (nomCamp) {
      if (campsBons.indexOf(nomCamp) !== -1) return;
      if (campDescripcio(nomCamp, consulta) &&
          campsBons.indexOf(campDescripcio(nomCamp, consulta)) !== -1) return;

      avisos.push({
        gravetat: 'mitja',
        titol: 'Un criteri de mes',
        heuFet: 'Heu filtrat pel camp <code>' + nomCamp + '</code>, que aquest encarrec no demana.',
        perque: 'Cada criteri de mes treu registres del resultat. Si no forma part de la pregunta, sobra.',
        aixi: 'Traieu-lo des de la finestra de criteris amb el boto <b>Suprimeix</b>.',
        unitat: '06'
      });
    });

    /* Un camp amb mes d'una condicio: la parella d'un or, o les dues fites
       d'un periode. Si en falta una, el camp hi es igualment i cap de les
       regles anteriors no ho veu. */
    campsBons.forEach(function (nomCamp) {
      var quantsMeus = meus.filter(function (c) { return c.camp === nomCamp; }).length;
      var quantsBons = bons.filter(function (c) { return c.camp === nomCamp; }).length;
      if (!quantsMeus || quantsMeus === quantsBons || quantsBons < 2) return;

      var bonsDelCamp = bons.filter(function (c) { return c.camp === nomCamp; });
      var enGrup = bonsDelCamp.some(function (c) { return c.grup != null; });
      var ambOr = bonsDelCamp.some(function (c) { return c.connector === 'or'; });

      if (quantsMeus < quantsBons) {
        avisos.push({
          gravetat: 'greu',
          titol: 'Falta una condicio sobre el mateix camp',
          heuFet: 'Sobre <code>' + nomCamp + '</code> hi teniu ' + quantsMeus +
                  ' condicio' + (quantsMeus > 1 ? 'ns' : '') + ' i l\'encarrec en demana ' + quantsBons + '.',
          perque: ambOr
            ? 'Les dues condicions van unides per <b>or</b>' + (enGrup ? ' dins d\'un parentesi' : '') +
              ': son dues possibilitats del mateix camp, i amb una de sola en deixeu fora la meitat.'
            : 'Son les dues fites que acoten el camp. Amb una de sola el resultat queda obert per un extrem.',
          aixi: 'Afegiu-hi: <code>' + textCriteri(bonsDelCamp[quantsMeus]) + '</code>' +
                (enGrup ? ', i combineu les dues files perque quedin dins del parentesi.' : '.'),
          unitat: enGrup ? '07' : exercici.unitat
        });
      } else {
        avisos.push({
          gravetat: 'mitja',
          titol: 'Una condicio de mes sobre el mateix camp',
          heuFet: 'Sobre <code>' + nomCamp + '</code> hi teniu ' + quantsMeus + ' condicions.',
          perque: 'L\'encarrec en demana ' + quantsBons + '. Cada condicio de mes unida per <b>and</b> ' +
                  'retalla el resultat, i si son igualtats sobre el mateix camp el deixa a zero.',
          aixi: 'Deixeu-n\'hi ' + quantsBons + '.',
          unitat: '06'
        });
      }
    });

    /* Mateix camp, operador o valor diferents */
    campsBons.forEach(function (nomCamp) {
      var meusDelCamp = meus.filter(function (c) { return c.camp === nomCamp; });
      var bonsDelCamp = bons.filter(function (c) { return c.camp === nomCamp; });
      if (!meusDelCamp.length) return;

      var def = defDe(consulta, nomCamp);

      /* Es nul fora d'un camp de data: l'error estrella. La causa no es la
         mateixa en un camp de text que en un de numeric, i l'explicacio
         tampoc pot ser-ho. */
      meusDelCamp.forEach(function (c) {
        if ((c.operador === 'es-nul' || c.operador === 'no-es-nul') && esNumeric(def)) {
          avisos.push({
            gravetat: 'greu',
            titol: 'Es nul tampoc funciona en un camp numeric',
            heuFet: 'Heu fet servir <b>' + Motor.operador(c.operador).etiqueta + '</b> sobre <code>' +
                    nomCamp + '</code>, que es de tipus <code>' + def.tipus + '</code>.',
            perque: 'Les dates son l\'unic tipus que pot ser nul de debo. Un camp numeric sense valor ' +
                    'no es nul: hi consta un <b>zero</b>. La condicio no la compleix ningu i la consulta ' +
                    'torna zero registres.',
            aixi: c.operador === 'es-nul'
              ? 'Compareu-lo amb zero: <code>' + nomCamp + ' Igual 0</code>.'
              : 'Compareu-lo amb zero al reves: <code>' + nomCamp + ' Diferent 0</code>.',
            unitat: '09'
          });
          return;
        }

        /* Acaba per sobre un camp de text farcit: no acaba mai amb lletra. */
        if ((c.operador === 'acaba-per' || c.operador === 'no-acaba-per') &&
            def.tipus === 'Char' && estaFarcit(consulta, nomCamp, def)) {
          avisos.push({
            gravetat: 'greu',
            titol: 'Acaba per no serveix en un camp de text farcit',
            heuFet: 'Heu fet servir <b>' + Motor.operador(c.operador).etiqueta + '</b> sobre <code>' +
                    nomCamp + '</code>.',
            perque: 'El camp te ' + def.longitud + ' caracters i Click &amp; Decide el farceix amb espais ' +
                    'fins al final. El contingut no acaba amb la lletra que busqueu: acaba amb espais. ' +
                    'La condicio no es compleix mai i la consulta torna zero registres sense avisar.',
            aixi: 'Feu servir <b>Inclou</b>, que busca el tros a qualsevol posicio: <code>' + nomCamp +
                  ' Inclou \'' + (c.valors && c.valors[0] ? c.valors[0] : 'text') + '\'</code>.',
            unitat: '18'
          });
          return;
        }

        if ((c.operador === 'es-nul' || c.operador === 'no-es-nul') && def.tipus !== 'Date') {
          avisos.push({
            gravetat: 'greu',
            titol: 'Es nul no funciona en un camp de text',
            heuFet: 'Heu fet servir <b>' + Motor.operador(c.operador).etiqueta + '</b> sobre <code>' + nomCamp + '</code>, que es de tipus <code>' + def.tipus + '</code>.',
            perque: 'Click &amp; Decide farceix els camps de text amb espais fins a la seva longitud. Un camp "buit" conte ' + def.longitud + ' espais, i per tant <b>no es nul</b>. La condicio no la compleix mai ningu i la consulta torna zero registres.',
            aixi: c.operador === 'es-nul'
              ? 'Per trobar-los buits: <code>' + nomCamp + ' Igual \' \'</code>, amb un espai. El valor que escriviu es farceix fins a la llargada del camp, i aixi nomes casa amb els que estan buits del tot. <b>Inclou</b> un espai no serveix: si els valors no omplen el camp, tots porten espais al final i sortirien tots.'
              : 'Per trobar-los amb contingut: <code>' + nomCamp + ' Diferent \' \'</code>, amb un espai.',
            unitat: '09'
          });
        }
      });

      /* Un valor que no existeix al camp. Es l'error que mes temps fa perdre,
         perque la consulta no falla: simplement no troba res. */
      meusDelCamp.forEach(function (c) {
        /* Nomes els operadors que anomenen un valor sencer es poden contrastar
           amb el catalag. Un patro de Com, un tros d'Inclou o una fita d'Entre
           no han de sortir a la llista de valors: no son valors. */
        if (['=', 'llista'].indexOf(c.operador) === -1) return;
        if (def.tipus === 'Date') return;
        var op = Motor.operador(c.operador);
        if (!op || op.valors === 0 || !(c.valors || []).length) return;
        var llista = cataleg(consulta, nomCamp);
        if (!llista) return;
        var existents = llista.map(function (v) { return v.valor === null ? '' : String(v.valor); });
        var inventats = (c.valors || []).filter(function (v) {
          return String(v).trim() !== '' && existents.indexOf(String(v).trim()) === -1;
        });
        if (!inventats.length) return;

        avisos.push({
          gravetat: 'greu',
          titol: 'Aquest valor no existeix al camp',
          heuFet: 'Heu buscat ' + inventats.map(function (v) { return '<code>' + v + '</code>'; }).join(' i ') +
                  ' a <code>' + nomCamp + '</code>.',
          perque: 'Cap registre no te aquest valor, de manera que la consulta torna zero sense donar ' +
                  'cap explicacio. Abans d\'escriure un criteri val la pena saber que hi ha al camp: ' +
                  'es fa amb una consulta d\'aquell camp sol i <b>Registres unics</b> a Si, o fent clic ' +
                  'al nom del camp aqui mateix.',
          aixi: 'Els valors que hi ha, amb el nombre de files de cadascun:<br><span class="cataleg">' +
                textCataleg(llista) + '</span>',
          unitat: '11'
        });
      });

      /* Diversos criteris "=" sobre el mateix camp units per AND */
      if (meusDelCamp.length > 1) {
        var totsIgual = meusDelCamp.every(function (c) { return c.operador === '='; });
        var capOr = meusDelCamp.slice(1).every(function (c) { return c.connector !== 'or'; });
        if (totsIgual && capOr) {
          avisos.push({
            gravetat: 'greu',
            titol: 'Dos criteris que no es poden complir alhora',
            heuFet: 'Heu posat ' + meusDelCamp.length + ' condicions d\'igualtat sobre <code>' + nomCamp + '</code>, unides per <b>and</b>.',
            perque: 'Els criteris s\'uneixen amb <b>and</b> per defecte. Esteu demanant que el mateix camp valgui dues coses a la vegada, cosa impossible: la consulta torna zero registres.',
            aixi: 'Feu servir l\'operador <b>Llista</b> amb els dos valors: <code>' + nomCamp + ' Llista (' + meusDelCamp.map(function (c) { return "'" + c.valors[0] + "'"; }).join(', ') + ')</code>.',
            unitat: '06'
          });
        }
      }

      /* Amb diverses condicions sobre el mateix camp es comparen una a una,
         en l'ordre en que estan escrites. */
      if (meusDelCamp.length > 1 && meusDelCamp.length === bonsDelCamp.length) {
        meusDelCamp.forEach(function (meu, k) {
          var bo = bonsDelCamp[k];
          if (meu.operador !== bo.operador) {
            avisos.push({
              gravetat: 'mitja',
              titol: 'Operador equivocat en una de les condicions',
              heuFet: 'La condicio ' + (k + 1) + ' sobre <code>' + nomCamp + '</code> fa servir <b>' +
                      Motor.operador(meu.operador).etiqueta + '</b>.',
              perque: explicaOperador(meu.operador, bo.operador),
              aixi: 'Hauria de ser <code>' + textCriteri(bo) + '</code>.',
              unitat: '06'
            });
          } else if (!mateixosValors(meu, bo)) {
            avisos.push({
              gravetat: 'mitja',
              titol: 'Valor equivocat en una de les condicions',
              heuFet: 'La condicio ' + (k + 1) + ' sobre <code>' + nomCamp + '</code> busca <code>' +
                      mostraValors(meu) + '</code>.',
              perque: 'Amb aquest valor la consulta no selecciona el que demana l\'encarrec.',
              aixi: 'Hauria de ser <code>' + mostraValors(bo) + '</code>.',
              unitat: '06'
            });
          }
        });
      }

      /* Operador diferent del de la solucio */
      if (meusDelCamp.length === 1 && bonsDelCamp.length === 1) {
        var meu = meusDelCamp[0], bo = bonsDelCamp[0];
        if (meu.operador !== bo.operador && !avisos.some(function (a) { return a.titol.indexOf('Es nul') === 0; })) {
          avisos.push({
            gravetat: 'mitja',
            titol: 'Operador equivocat',
            heuFet: 'Sobre <code>' + nomCamp + '</code> heu fet servir <b>' + Motor.operador(meu.operador).etiqueta + '</b>.',
            perque: explicaOperador(meu.operador, bo.operador),
            aixi: 'Hauria de ser <code>' + textCriteri(bo) + '</code>.',
            unitat: '06'
          });
        } else if (meu.operador === bo.operador && !mateixosValors(meu, bo) &&
                   !avisos.some(function (a) {
                     return a.titol === 'Aquest valor no existeix al camp' &&
                            a.heuFet.indexOf('<code>' + nomCamp + '</code>') !== -1;
                   })) {
          var nomes = diferenciaDeMajuscules(meu, bo);
          avisos.push({
            gravetat: nomes ? 'greu' : 'mitja',
            titol: nomes ? 'Majuscules i minuscules' : 'Valor equivocat',
            heuFet: 'Hi heu posat <code>' + mostraValors(meu) + '</code>.',
            perque: nomes
              ? 'El valor s\'ha d\'escriure <b>exactament igual</b> que al contingut del camp, respectant majuscules i minuscules. Amb una lletra canviada, la consulta torna zero registres i no avisa de res.'
              : 'Amb aquest valor la consulta no selecciona els registres que demana l\'encarrec.',
            aixi: 'Hauria de ser <code>' + mostraValors(bo) + '</code>.' + (function () {
              var llista = cataleg(consulta, nomCamp);
              return llista ? '<br>Tot el que hi ha al camp:<br><span class="cataleg">' +
                              textCataleg(llista) + '</span>' : '';
            })(),
            unitat: '06'
          });
        }
      }
    });

    return avisos;
  }

  function raoDelCriteri(nomCamp, exercici) {
    var raons = {
      'IND_ACTIU': 'Sense aquest filtre la taula inclou tambe qui ja no hi treballa pero encara te nomina. El nombre que obtindreu no es la plantilla.',
      'LLOC_ESTAT_PLANT_C': 'Sense aquest filtre el llistat barreja llocs vigents amb llocs historics i amb llocs previstos que encara no existeixen.',
      'TIPR_TIPUS_PRESSUP': 'Es el camp que diu si el lloc te dotacio i si esta ocupat. Sense ell no es pot distingir una vacant cobrible d\'una que no ho es.',
      'INCI_DATA_INICI': 'Sense la data d\'inici, la consulta no acota el periode.',
      'INCI_DATA_FI': 'Sense la data de fi, la consulta no sap si el registre encara era viu dins del periode.',
      'LLOC_QUANTA_HORARI': 'Es el camp que diu quina part de la jornada cobreix el lloc. Sense ell, un lloc al 33 % compta igual que un de sencer.'
    };
    return raons[nomCamp] || 'L\'encarrec el necessita per acotar el resultat.';
  }

  function explicaOperador(meu, bo) {
    if (bo === 'llista' && meu === '=') {
      return 'Amb <b>Igual</b> nomes podeu buscar un valor. L\'encarrec en demana mes d\'un, i per aixo cal <b>Llista</b>, que els uneix amb un or intern.';
    }
    if (bo === 'no-en-la-llista' && (meu === '<>' || meu === '=')) {
      return 'Per excloure diversos valors alhora cal <b>No en la llista</b>. Amb un sol operador d\'igualtat nomes n\'excloeu un.';
    }
    if (bo === '<=' && meu === '<') return 'El limit del periode hi ha d\'entrar. Amb <b>&lt;</b> deixeu fora l\'ultim dia.';
    if (bo === '>=' && meu === '>') return 'El limit del periode hi ha d\'entrar. Amb <b>&gt;</b> deixeu fora el primer dia.';
    if (bo === 'inclou' && meu === '=') return 'Per trobar un camp de text buit cal comprovar que <b>contingui</b> un espai, no que hi sigui igual, si els valors normals del camp poden portar espais.';
    return 'Amb aquest operador la condicio no selecciona el mateix conjunt de registres.';
  }

  /* --- Parentesis ---------------------------------------------------------- */

  function comprovaParentesis(consulta, sol) {
    var meus = consulta.criteris || [];
    var bons = sol.consulta.criteris || [];

    var solAgrupa = bons.some(function (c) { return c.grup != null; });
    var joAgrupo = meus.some(function (c) { return c.grup != null; });
    var joTincOr = meus.some(function (c) { return c.connector === 'or'; });

    if (solAgrupa && !joAgrupo && joTincOr) {
      var delGrup = bons.filter(function (c) { return c.grup != null; });
      return {
        gravetat: 'greu',
        titol: 'Falta el parentesi',
        heuFet: 'Teniu un <b>or</b> sense agrupar. El programa aplica primer tots els <b>and</b> i despres l\'<b>or</b>, de manera que l\'ultim criteri queda sol en un bloc a part.',
        perque: 'Els criteris que hi ha abans de l\'or <b>no s\'apliquen</b> a la branca de la dreta. Per aixo el resultat surt inflat amb registres que no compleixen els filtres generals. I es perillos precisament perque torna dades, no zero.',
        aixi: 'Seleccioneu les files de <code>' + unics(delGrup.map(function (c) { return c.camp; })).join('</code> i <code>') +
              '</code> amb <b>Ctrl</b> i premeu <b>Combina</b>. Al panell Camps el parentesi ha d\'abraçar nomes aquestes dues.',
        unitat: '07'
      };
    }

    if (solAgrupa && joAgrupo) {
      var dinsMeu = meus.filter(function (c) { return c.grup != null; });
      var totAnd = dinsMeu.slice(1).every(function (c) { return c.connector !== 'or'; });
      if (totAnd && dinsMeu.length > 1) {
        return {
          gravetat: 'greu',
          titol: 'El parentesi hi es, pero a dins hi ha un and',
          heuFet: 'Heu combinat les dues condicions, pero les uneix un <b>and</b>.',
          perque: 'Aixo demana que es compleixin les dues alhora. Si son dos valors del mateix camp, o una data i el seu nul, es impossible i la consulta torna zero registres.',
          aixi: 'Feu clic sobre l\'<b>and</b> de dins del parentesi per convertir-lo en <b>or</b>.',
          unitat: '13'
        };
      }
    }

    if (!solAgrupa && joAgrupo) {
      return {
        gravetat: 'suau',
        titol: 'Un parentesi que no cal',
        heuFet: 'Heu agrupat criteris que no ho necessiten.',
        perque: 'No fa mal, pero tampoc no fa res: sense cap or, tots els criteris ja son obligatoris.',
        aixi: 'Podeu desfer-lo amb <b>No combinis</b>.',
        unitat: '07'
      };
    }
    return null;
  }

  /* --- Agregats ------------------------------------------------------------ */

  function comparaAgregats(consulta, sol) {
    var avisos = [];
    var meus = (consulta.camps || []).filter(function (c) { return c.agregat; });
    var bons = (sol.consulta.camps || []).filter(function (c) { return c.agregat; });

    if (sol.consulta.compteAsterisc && !consulta.compteAsterisc && !meus.length) return avisos;

    /* La solucio compta persones distintes i l'usuari compta files */
    bons.forEach(function (bo) {
      var meu = meus.filter(function (c) { return c.nom === bo.camp || c.nom === bo.nom; })[0];
      if (!meu) return;
      if (meu.agregat === bo.agregat) return;

      if (bo.agregat === 'distinct-compte' && meu.agregat === 'compte') {
        avisos.push({
          gravetat: 'greu',
          titol: 'Compteu files, no persones',
          heuFet: 'Heu fet <b>Agregats &gt; Compte</b> sobre <code>' + meu.nom + '</code>.',
          perque: 'Aquesta taula es de <b>registres multiples</b>: una mateixa persona hi apareix tantes vegades com registres te. Un compte normal els suma tots, de manera que compteu <b>files</b> i no gent.',
          aixi: 'Feu servir <b>Distinct Agregats &gt; Compte</b>. Al menu del boto dret son dues linies consecutives, i es facil agafar-ne una per l\'altra.',
          unitat: '10'
        });
      } else if (bo.agregat === 'compte' && meu.agregat === 'distinct-compte') {
        avisos.push({
          gravetat: 'mitja',
          titol: 'Compteu valors distints, no files',
          heuFet: 'Heu fet <b>Distinct Agregats</b> sobre <code>' + meu.nom + '</code>.',
          perque: 'L\'encarrec demana quants registres hi ha, no quants valors diferents. Amb Distinct, dues incidencies de la mateixa persona compten com una.',
          aixi: 'Feu servir <b>Agregats &gt; Compte</b>.',
          unitat: '10'
        });
      } else {
        avisos.push({
          gravetat: 'mitja',
          titol: 'Agregat equivocat',
          heuFet: 'Heu aplicat <b>' + (Motor.AGREGATS[meu.agregat] || {}).etiqueta + '</b> sobre <code>' + meu.nom + '</code>.',
          perque: 'Aquest agregat no respon la pregunta de l\'encarrec.',
          aixi: 'Hauria de ser <b>' + (Motor.AGREGATS[bo.agregat] || {}).etiqueta + '</b>.',
          unitat: '10'
        });
      }
    });

    /* El camp hi es pero sense agregat: en comptes d'una xifra, un llistat */
    bons.forEach(function (bo) {
      var mateix = (consulta.camps || []).filter(function (c) {
        return nomCurtCamp(c.nom) === nomCurtCamp(bo.nom);
      })[0];
      if (!mateix || mateix.agregat) return;
      var a = Motor.AGREGATS[bo.agregat] || {};
      avisos.push({
        gravetat: 'greu',
        titol: 'Falta el comptador',
        heuFet: 'Teniu <code>' + nomCurtCamp(mateix.nom) + '</code> seleccionat, pero sense cap agregat: ' +
                'obteniu el llistat sencer, una fila per registre.',
        perque: 'L\'encarrec demana una xifra, no una llista. Mentre no hi hagi cap agregat, la consulta ' +
                'no agrupa res i el nombre de registres del peu es el nombre de files, no la resposta.',
        aixi: 'Clic dret sobre <code>' + nomCurtCamp(mateix.nom) + '</code> &rarr; <b>' +
              (a.menu || 'Agregats') + ' &rarr; ' + (a.etiqueta || '') + '</b>.',
        unitat: '10'
      });
    });

    /* Camp de detall que trenca l'agrupacio */
    if (bons.length) {
      var agrupadorsBons = (sol.consulta.camps || [])
        .filter(function (c) { return !c.agregat; }).map(function (c) { return c.nom; });
      (consulta.camps || []).forEach(function (c) {
        if (c.agregat || agrupadorsBons.indexOf(c.nom) !== -1) return;
        var p = partsCamp(consulta, c.nom);
        var def = Motor.camp(p.taula, p.curt);
        var clau = Motor.taula(p.taula).clau;
        if (def && (p.curt === clau || esDetall(p.taula, p.taula + '.' + p.curt))) {
          avisos.push({
            gravetat: 'greu',
            titol: 'Un camp de detall trenca l\'agrupacio',
            heuFet: 'Teniu seleccionat <code>' + c.nom + '</code>, que es diferent per a cada registre.',
            perque: 'S\'agrupa per tot el que queda seleccionat. Amb un camp unic a la consulta, cada grup te una sola fila i la columna de recompte s\'omple d\'uns.',
            aixi: 'Traieu <code>' + c.nom + '</code> de la consulta i deixeu-hi nomes els camps pels quals voleu agrupar.',
            unitat: '10'
          });
        }
      });
    }

    return avisos;
  }

  function esDetall(nomTaula, nomCamp) {
    var files = Motor.files(nomTaula);
    var valors = new Set(files.map(function (f) { return f[nomCamp]; }));
    return valors.size > files.length * 0.8;
  }

  /* --- Utilitats ------------------------------------------------------------ */

  function unics(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  /* Dues consultes donen el mateix si tornen les mateixes files, sense
     importar-ne l'ordre. */
  function igualtatDeResultats(a, b, compteLOrdre) {
    if (a.registres !== b.registres) return false;
    var sa = (a.files || []).map(function (f) { return f.join('\u0001'); });
    var sb = (b.files || []).map(function (f) { return f.join('\u0001'); });
    if (!compteLOrdre) { sa = sa.slice().sort(); sb = sb.slice().sort(); }
    return sa.join('\u0002') === sb.join('\u0002');
  }

  /* Un resultat d'una sola fila amb un agregat es descriu pel seu valor; la
     resta, pel nombre de registres. */
  function descriuResultat(r, curt) {
    var unicAgregat = r.columnes && r.columnes.length === 1 && r.columnes[0].agregat;
    if (unicAgregat && r.files.length === 1) {
      return (curt ? '' : 'La vostra consulta dona ') + '<b>' + r.files[0][0] + '</b>';
    }
    return (curt ? '' : 'La vostra consulta torna ') + '<b>' + r.registres + '</b> registres';
  }

  /* Donat un camp de codi, torna el seu bessó de descripcio si existeix a la
     taula, i a l'inreves. Serveix per detectar que s'ha filtrat pel camp
     equivocat de la parella. */
  function campDescripcio(nomCamp, consulta) {
    var p = partsCamp(consulta, nomCamp);
    if (!p.taula) return null;
    var qualificat = nomCamp.indexOf('.') !== -1;
    var parelles = [['_CODI', '_DESC'], ['_C', '_D']];
    for (var i = 0; i < parelles.length; i++) {
      var codi = parelles[i][0], desc = parelles[i][1];
      var candidat = null;
      if (p.curt.slice(-codi.length) === codi) {
        candidat = p.curt.slice(0, -codi.length) + desc;
      } else if (p.curt.slice(-desc.length) === desc) {
        candidat = p.curt.slice(0, -desc.length) + codi;
      }
      if (candidat && Motor.camp(p.taula, candidat)) {
        return qualificat ? p.taula + '.' + candidat : candidat;
      }
    }
    return null;
  }

  /* Els noms de camp poden venir qualificats ("TAULA.CAMP") quan la consulta
     treballa amb mes d'una taula, o a seques quan nomes n'hi ha una. */
  function partsCamp(consulta, nomCamp) {
    var i = String(nomCamp).indexOf('.');
    if (i !== -1) return { taula: nomCamp.slice(0, i), curt: nomCamp.slice(i + 1) };
    return { taula: taulesDe(consulta)[0], curt: nomCamp };
  }

  function esNumeric(def) { return def.tipus === 'Integer' || def.tipus === 'Pack'; }

  /* Un camp de text nomes queda farcit d'espais si els seus valors no arriben
     a omplir-lo. Al NIF, que ocupa els nou caracters justos, no hi ha
     farciment i "Acaba per" funciona perfectament. */
  function estaFarcit(consulta, nomCamp, def) {
    var p = partsCamp(consulta, nomCamp);
    if (!p.taula || !Motor.camp(p.taula, p.curt)) return false;
    return Motor.valors(p.taula, p.curt).some(function (v) {
      return v.valor !== null && String(v.valor).length < def.longitud;
    });
  }

  /* Quins valors te de debo un camp. Nomes te sentit ensenyar-los quan son
     pocs: d'un NIF no se'n pot fer catalag, d'un codi d'estat si. */
  function cataleg(consulta, nomCamp) {
    var p = partsCamp(consulta, nomCamp);
    if (!p.taula || !Motor.camp(p.taula, p.curt)) return null;
    var llista = Motor.valors(p.taula, p.curt);
    return llista.length <= 14 ? llista : null;
  }

  function textCataleg(llista) {
    return llista.map(function (v) {
      var etiqueta = v.valor === null ? 'nul' : (v.valor === '' ? '(buit)' : v.valor);
      return '<code>' + etiqueta + '</code> <span class="quants">' + v.files + '</span>';
    }).join('  ');
  }

  function defDe(consulta, nomCamp) {
    var p = partsCamp(consulta, nomCamp);
    return (p.taula && Motor.camp(p.taula, p.curt)) || {};
  }

  function mateixosValors(a, b) {
    var va = (a.valors || []).map(String), vb = (b.valors || []).map(String);
    if (va.length !== vb.length) return false;
    return va.slice().sort().join('|') === vb.slice().sort().join('|');
  }

  function diferenciaDeMajuscules(a, b) {
    var va = (a.valors || []).map(String), vb = (b.valors || []).map(String);
    if (va.length !== vb.length) return false;
    var igualSenseCas = va.map(function (v) { return v.toLowerCase(); }).sort().join('|') ===
                        vb.map(function (v) { return v.toLowerCase(); }).sort().join('|');
    return igualSenseCas && !mateixosValors(a, b);
  }

  function mostraValors(c) {
    var v = (c.valors || []).map(function (x) { return "'" + x + "'"; });
    return v.length ? v.join(', ') : '(cap valor)';
  }

  function textCriteri(c) {
    var op = Motor.operador(c.operador);
    var etiqueta = op ? op.etiqueta : c.operador;
    if (op && op.valors === 0) return c.camp + ' ' + etiqueta;
    if (c.parametre) return c.camp + ' ' + etiqueta + ' :' + c.parametre;
    return c.camp + ' ' + etiqueta + ' ' + mostraValors(c);
  }

  return { corregeix: corregeix };
})();
