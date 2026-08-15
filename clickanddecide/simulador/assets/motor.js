/* ---------------------------------------------------------------------------
   Motor de consultes.

   No es un motor SQL generic: reprodueix el comportament de Click & Decide,
   incloses les seves rareses, perque son justament el que s'ha d'aprendre.

   La mes important: els camps Char es guarden FARCITS D'ESPAIS fins a la seva
   longitud. D'aqui en surten, sense cap regla especial, tots els comportaments
   que el curs explica:

     - "Es nul" en un camp de text no troba mai res, perque el camp conte
       espais i no es nul.
     - "Diferent d'un espai" si que troba els camps amb contingut.
     - "Inclou un espai" troba els buits... i tambe els valors que porten
       espais entre paraules, que es el parany de la unitat 18.
   --------------------------------------------------------------------------- */

const Motor = (function () {
  'use strict';

  /* --- Esquema ----------------------------------------------------------- */

  function taula(nom) {
    var t = DADES[nom];
    if (!t) throw new Error('No existeix la taula ' + nom);
    return t;
  }

  function camp(nomTaula, nomCamp) {
    return taula(nomTaula).camps.filter(function (c) { return c.nom === nomCamp; })[0];
  }

  function nomsTaules() {
    return Object.keys(DADES);
  }

  /* --- Valors ------------------------------------------------------------
     Aixo es el cor del simulador. Un camp Char sempre torna el seu valor
     farcit d'espais per la dreta; un camp Date torna null quan es buit.
     ------------------------------------------------------------------- */

  function farceix(text, longitud) {
    text = text == null ? '' : String(text);
    return text.length >= longitud ? text : text + ' '.repeat(longitud - text.length);
  }

  /* Nomes els camps de data poden ser nuls de veritat. Un camp de text buit
     son espais, i un camp numeric buit es un zero: cap dels dos es nul, i
     aquesta es la causa de la meitat de les consultes que tornen zero
     registres sense donar cap explicacio. */
  function esNumeric(definicio) {
    return definicio.tipus === 'Integer' || definicio.tipus === 'Pack';
  }

  function valor(fila, definicio, index) {
    var brut = fila[index];
    if (definicio.tipus === 'Date') {
      return brut && brut.trim() ? brut.trim() : null;
    }
    if (esNumeric(definicio)) {
      var n = Number(String(brut == null ? '' : brut).trim());
      return isNaN(n) ? 0 : n;
    }
    return farceix(brut, definicio.longitud);
  }

  /* Files d'una taula, amb el farciment aplicat i les claus qualificades
     amb el nom de la taula: "WAIV9010_PERSONA.PERS_NIF". */
  function files(nomTaula) {
    var t = taula(nomTaula);
    return t.files.map(function (f) {
      var o = {};
      t.camps.forEach(function (c, i) { o[nomTaula + '.' + c.nom] = valor(f, c, i); });
      return o;
    });
  }

  /* --- Enllac entre taules ------------------------------------------------
     A Click & Decide s'enllaça arrossegant un camp d'una taula fins al seu
     homonim de l'altra. Aqui l'enllac es un objecte amb els dos extrems i el
     tipus, que son els dos que descriu el manual:

       'coincidents'  nomes les files que casen pels dos costats
       'totes-esq'    totes les de la primera taula, tinguin parella o no

     El segon es el que el manual recomana perque "sempre funciona sigui quin
     sigui el tipus de taules enllaçades", i es l'unic que permet trobar les
     referencies trencades.
     -------------------------------------------------------------------- */

  function combinacio(taules, enllacos) {
    var base = files(taules[0]);

    for (var i = 1; i < taules.length; i++) {
      var seguent = taules[i];
      var jaHiSon = taules.slice(0, i);

      var e = (enllacos || []).filter(function (x) {
        return (x.taulaA === seguent && jaHiSon.indexOf(x.taulaB) !== -1) ||
               (x.taulaB === seguent && jaHiSon.indexOf(x.taulaA) !== -1);
      })[0];

      if (!e) {
        return { error: "Falta definir l'enllac entre " + jaHiSon.join(' i ') +
                        ' i ' + seguent + '. Sense enllac, el programa creuaria ' +
                        'totes les files amb totes i el resultat no voldria dir res.' };
      }

      var esqTaula = e.taulaA === seguent ? e.taulaB : e.taulaA;
      var esqCamp  = e.taulaA === seguent ? e.campB  : e.campA;
      var dreCamp  = e.taulaA === seguent ? e.campA  : e.campB;

      var index = new Map();
      files(seguent).forEach(function (f) {
        var clau = clauEnllac(f[seguent + '.' + dreCamp]);
        if (!index.has(clau)) index.set(clau, []);
        index.get(clau).push(f);
      });

      var noves = [];
      base.forEach(function (fila) {
        var parelles = index.get(clauEnllac(fila[esqTaula + '.' + esqCamp])) || [];
        if (parelles.length) {
          parelles.forEach(function (p) { noves.push(Object.assign({}, fila, p)); });
        } else if (e.tipus === 'totes-esq') {
          noves.push(Object.assign({}, fila, buida(seguent)));
        }
      });
      base = noves;
    }
    return { files: base };
  }

  function clauEnllac(v) {
    return v === null ? '\u0000' : String(v).replace(/\s+$/, '');
  }

  function buida(nomTaula) {
    var o = {};
    taula(nomTaula).camps.forEach(function (c) {
      o[nomTaula + '.' + c.nom] = c.tipus === 'Date' ? null : farceix('', c.longitud);
    });
    return o;
  }

  /* --- Noms de camp -------------------------------------------------------
     Una consulta d'una sola taula pot fer servir noms curts; una de diverses
     els ha de qualificar. Aqui es normalitza tot a la forma llarga.
     -------------------------------------------------------------------- */

  function taulesDe(consulta) {
    if (consulta.taules && consulta.taules.length) return consulta.taules;
    return consulta.taula ? [consulta.taula] : [];
  }

  function qualifica(consulta, nom) {
    if (!nom) return nom;
    if (nom.indexOf('.') !== -1) return nom;
    var ts = taulesDe(consulta);
    for (var i = 0; i < ts.length; i++) {
      if (camp(ts[i], nom)) return ts[i] + '.' + nom;
    }
    return (ts[0] || '') + '.' + nom;
  }

  function defDe(nomQualificat) {
    var parts = nomQualificat.split('.');
    return camp(parts[0], parts[1]);
  }

  function nomCurt(nom) { return nom.indexOf('.') === -1 ? nom : nom.split('.')[1]; }

  /* --- Operadors ---------------------------------------------------------
     Els vint que ofereix el programa, amb el nom exacte del desplegable.
     ------------------------------------------------------------------- */

  var OPERADORS = [
    { id: '=',              etiqueta: '=',                 valors: 1 },
    { id: '<>',             etiqueta: '<>',                valors: 1 },
    { id: '>',              etiqueta: '>',                 valors: 1 },
    { id: '>=',             etiqueta: '>=',                valors: 1 },
    { id: '<',              etiqueta: '<',                 valors: 1 },
    { id: '<=',             etiqueta: '<=',                valors: 1 },
    { id: 'es-nul',         etiqueta: 'És nul',            valors: 0 },
    { id: 'entre',          etiqueta: 'Entre',             valors: 2 },
    { id: 'llista',         etiqueta: 'Llista',            valors: 'n' },
    { id: 'comenca-per',    etiqueta: 'Comença per',       valors: 1 },
    { id: 'acaba-per',      etiqueta: 'Acaba per',         valors: 1 },
    { id: 'inclou',         etiqueta: 'Inclou',            valors: 1 },
    { id: 'com',            etiqueta: 'Com',               valors: 1 },
    { id: 'no-es-nul',      etiqueta: 'No és nul',         valors: 0 },
    { id: 'no-entre',       etiqueta: 'No entre',          valors: 2 },
    { id: 'no-en-la-llista',etiqueta: 'No en la llista',   valors: 'n' },
    { id: 'no-comenca-per', etiqueta: 'No comença per',    valors: 1 },
    { id: 'no-acaba-per',   etiqueta: 'No acaba per',      valors: 1 },
    { id: 'no-inclou',      etiqueta: 'No inclou',         valors: 1 },
    { id: 'no-es-com',      etiqueta: 'No és com',         valors: 1 }
  ];

  function operador(id) {
    return OPERADORS.filter(function (o) { return o.id === id; })[0];
  }

  /* Els operadors de comparacio exacta farceixen tambe el valor buscat, tal
     com fa la base de dades amb els camps de longitud fixa. Els de
     coincidencia parcial, no: comparen contra el valor farcit tal qual. */
  function compara(id, valorCamp, valors, definicio) {
    var esData = definicio.tipus === 'Date';
    var esNum = esNumeric(definicio);
    var v0 = valors[0] == null ? '' : String(valors[0]);
    var v1 = valors[1] == null ? '' : String(valors[1]);

    function ajusta(v) {
      if (esData) return v.trim() || null;
      if (esNum) { var n = Number(String(v).trim().replace(',', '.')); return isNaN(n) ? 0 : n; }
      return farceix(v, definicio.longitud);
    }

    /* Els operadors de text sobre un camp numeric treballen amb la xifra
       escrita, sense farciment. */
    function comText() { return String(valorCamp); }

    switch (id) {
      case 'es-nul':    return valorCamp === null;
      case 'no-es-nul': return valorCamp !== null;
    }

    /* Un camp de data nul no compleix cap altra condicio. */
    if (valorCamp === null) return false;

    switch (id) {
      case '=':  return valorCamp === ajusta(v0);
      case '<>': return valorCamp !== ajusta(v0);
      case '>':  return valorCamp >  ajusta(v0);
      case '>=': return valorCamp >= ajusta(v0);
      case '<':  return valorCamp <  ajusta(v0);
      case '<=': return valorCamp <= ajusta(v0);

      case 'entre':    return valorCamp >= ajusta(v0) && valorCamp <= ajusta(v1);
      case 'no-entre': return !(valorCamp >= ajusta(v0) && valorCamp <= ajusta(v1));

      case 'llista':
        return valors.some(function (v) { return valorCamp === ajusta(String(v)); });
      case 'no-en-la-llista':
        return !valors.some(function (v) { return valorCamp === ajusta(String(v)); });

      case 'comenca-per':    return comText().indexOf(v0) === 0;
      case 'no-comenca-per': return comText().indexOf(v0) !== 0;
      case 'acaba-per':      return comText().slice(-v0.length) === v0;
      case 'no-acaba-per':   return comText().slice(-v0.length) !== v0;
      case 'inclou':         return comText().indexOf(v0) !== -1;
      case 'no-inclou':      return comText().indexOf(v0) === -1;

      case 'com':    return comodins(v0).test(comText());
      case 'no-es-com': return !comodins(v0).test(comText());
    }
    return false;
  }

  /* --- Parametres -----------------------------------------------------------
     Un criteri pot no portar el valor escrit: pot portar el NOM d'un parametre.
     Llavors el valor no es decideix quan es fa la consulta sino cada vegada
     que s'executa, i el programa el demana. Es el que expliquen les unitats
     16 i 17: una sola consulta que serveix per a tots els departaments en
     comptes de vint consultes iguals amb el codi canviat.
     ---------------------------------------------------------------------- */

  /* Els noms de parametre que fa servir una consulta, en ordre d'aparicio. */
  function parametres(consulta) {
    var vistos = [];
    (consulta.criteris || []).forEach(function (c) {
      if (c.parametre && vistos.indexOf(c.parametre) === -1) vistos.push(c.parametre);
    });
    return vistos;
  }

  /* Els valors amb els quals s'ha d'avaluar un criteri: els que porta escrits
     o els que s'han respost per al seu parametre. */
  function valorsDelCriteri(c, consulta) {
    if (!c.parametre) return c.valors || [];
    var donats = (consulta && consulta.valorsParametres) || {};
    var v = donats[c.parametre];
    if (v == null) return null;                 // encara no s'ha respost
    return Array.isArray(v) ? v : [v];
  }

  function comodins(patro) {
    var escapat = patro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                       .replace(/%/g, '.*').replace(/_/g, '.');
    return new RegExp('^' + escapat + '$');
  }

  /* --- Avaluacio dels criteris -------------------------------------------
     Els criteris son una llista plana. Els que comparteixen "grup" van entre
     parentesis. Fora dels parentesis, l'AND lliga mes fort que l'OR, que es
     exactament el que provoca el cas dels alts carrecs de la unitat 7.
     ------------------------------------------------------------------- */

  function avalua(criteris, fila, consulta) {
    if (!criteris.length) return true;

    /* 1. Cada criteri es converteix en el seu valor de veritat. */
    var atoms = criteris.map(function (c) {
      var nom = qualifica(consulta, c.camp);
      var def = defDe(nom);
      if (!def) return { valor: false, connector: c.connector, grup: c.grup };
      var valors = valorsDelCriteri(c, consulta);
      if (valors === null) return { valor: false, connector: c.connector || 'and', grup: c.grup };
      var res = compara(c.operador, fila[nom], valors, def);
      if (c.negat) res = !res;
      return { valor: res, connector: c.connector || 'and', grup: c.grup };
    });

    /* 2. Els grups es resolen primer, cadascun pel seu compte. */
    var blocs = [];
    var i = 0;
    while (i < atoms.length) {
      var g = atoms[i].grup;
      if (g == null) {
        blocs.push({ valor: atoms[i].valor, connector: atoms[i].connector });
        i++;
      } else {
        var membres = [];
        var connectorEntrada = atoms[i].connector;
        while (i < atoms.length && atoms[i].grup === g) { membres.push(atoms[i]); i++; }
        blocs.push({ valor: combina(membres), connector: connectorEntrada });
      }
    }

    return combina(blocs);
  }

  /* Combina una llista de blocs amb precedencia: primer els AND, despres els OR. */
  function combina(blocs) {
    if (!blocs.length) return true;
    var acumulatOr = false;
    var acumulatAnd = blocs[0].valor;

    for (var i = 1; i < blocs.length; i++) {
      if (blocs[i].connector === 'or') {
        acumulatOr = acumulatOr || acumulatAnd;
        acumulatAnd = blocs[i].valor;
      } else {
        acumulatAnd = acumulatAnd && blocs[i].valor;
      }
    }
    return acumulatOr || acumulatAnd;
  }

  /* --- Agregats ----------------------------------------------------------- */

  /* El submenu d'agregats del programa, en el seu ordre i sencer. Els que
     nomes tenen sentit amb nombres surten apagats quan el camp no ho es, i
     els estadistics queden apagats sempre: el laboratori no els calcula. */
  var AGREGATS = {
    'minim':           { etiqueta: 'Mínim',    menu: 'Agregats',          tipus: 'qualsevol' },
    'maxim':           { etiqueta: 'Màxim',    menu: 'Agregats',          tipus: 'qualsevol' },
    'suma':            { etiqueta: 'Suma',     menu: 'Agregats',          tipus: 'numeric' },
    'mitjana':         { etiqueta: 'Mitjana',  menu: 'Agregats',          tipus: 'numeric' },
    'desv':            { etiqueta: 'Desviació estàndard', menu: 'Agregats', tipus: 'fora' },
    'desv-pob':        { etiqueta: 'Desviació estàndard de la població', menu: 'Agregats', tipus: 'fora' },
    'var':             { etiqueta: 'Variança', menu: 'Agregats',          tipus: 'fora' },
    'var-pob':         { etiqueta: 'Variança de la població', menu: 'Agregats', tipus: 'fora' },
    'compte':          { etiqueta: 'Compte',   menu: 'Agregats',          tipus: 'qualsevol' },
    'distinct-compte': { etiqueta: 'Compte',   menu: 'Distinct Agregats', tipus: 'qualsevol' }
  };

  function aplicaAgregat(tipus, valors) {
    var nets = valors.filter(function (v) { return v !== null && String(v).trim() !== ''; });
    switch (tipus) {
      case 'compte':          return nets.length;
      case 'distinct-compte': return new Set(nets.map(String)).size;
      case 'minim':           return extrem(nets, 0);
      case 'maxim':           return extrem(nets, -1);
      case 'suma':            return nets.reduce(function (a, v) { return a + Number(v); }, 0);
      case 'mitjana':
        if (!nets.length) return null;
        return Math.round(nets.reduce(function (a, v) { return a + Number(v); }, 0) / nets.length * 100) / 100;
    }
    return null;
  }

  /* Amb nombres cal ordenar com a nombres: ordenats com a text, el 100 aniria
     davant del 9. */
  function extrem(valors, quin) {
    if (!valors.length) return null;
    var tots = valors.every(function (v) { return typeof v === 'number'; });
    var ordenats = valors.slice().sort(tots
      ? function (a, b) { return a - b; }
      : function (a, b) { return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0; });
    return quin === 0 ? ordenats[0] : ordenats[ordenats.length - 1];
  }

  /* --- Execucio ----------------------------------------------------------- */

  function executa(consulta) {
    var taules = taulesDe(consulta);
    if (!taules.length) {
      return { error: 'No heu seleccionat cap taula.', files: [], columnes: [], registres: 0 };
    }
    var visibles = (consulta.camps || []).filter(function (c) { return !c.ocult; });
    if (!visibles.length && !consulta.compteAsterisc) {
      return { error: 'No heu seleccionat cap camp.', files: [], columnes: [], registres: 0 };
    }

    /* Si la consulta te parametres, no es pot executar fins que no s'han
       respost: el programa obre la finestra que els demana. */
    var falten = parametres(consulta).filter(function (nom) {
      return !consulta.valorsParametres || consulta.valorsParametres[nom] == null;
    });
    if (falten.length) {
      return { error: 'Falta el valor ' +
                      (falten.length === 1 ? 'del parametre ' : 'dels parametres ') +
                      falten.join(', ') + '.',
               files: [], columnes: [], registres: 0, faltenParametres: falten };
    }

    /* Combinacio de taules i filtratge */
    var combinades = combinacio(taules, consulta.enllacos);
    if (combinades.error) {
      return { error: combinades.error, files: [], columnes: [], registres: 0 };
    }
    var filtrades = combinades.files.filter(function (f) {
      return avalua(consulta.criteris || [], f, consulta);
    });

    /* La propietat "Primers registres" retalla el resultat. Amb l'asterisc, que
     es el valor per defecte, no retalla res. Si "Percentatge" esta actiu, la
     xifra s'enten com un tant per cent del que hauria sortit. */
  function limita(files, consulta) {
    var n = String(consulta.primersRegistres == null ? '*' : consulta.primersRegistres).trim();
    if (!n || n === '*') return files;
    var quants = parseFloat(n.replace(',', '.'));
    if (!(quants > 0)) return files;
    if (consulta.percentatge) quants = Math.ceil(files.length * quants / 100);
    return files.slice(0, quants);
  }

  /* Compte(*) es un comptador de files, sense agrupar res. */
    if (consulta.compteAsterisc) {
      return {
        columnes: [{ nom: 'Compte(*)', agregat: 'compte' }],
        files: [[filtrades.length]],
        registres: 1,
        filesFiltrades: filtrades
      };
    }

    var ambAgregat = visibles.filter(function (c) { return c.agregat; });
    var agrupadors = visibles.filter(function (c) { return !c.agregat; });

    var columnes = visibles.map(function (c) {
      return {
        nom: c.agregat ? etiquetaAgregat(c) : (taules.length > 1 ? qualifica(consulta, c.nom) : nomCurt(c.nom)),
        camp: c.nom,
        agregat: c.agregat || null
      };
    });

    /* Les files combinades porten les claus qualificades amb el nom de la
       taula, escrigui l'usuari el camp com l'escrigui. */
    function clauDe(c) { return qualifica(consulta, c.nom); }

    var resultat;
    if (!ambAgregat.length) {
      resultat = filtrades.map(function (f) {
        return visibles.map(function (c) { return mostra(f[clauDe(c)]); });
      });
      if (consulta.registresUnics) resultat = distintes(resultat);
    } else {
      var grups = new Map();
      filtrades.forEach(function (f) {
        var clau = agrupadors.map(function (c) { return f[clauDe(c)]; }).join('\u0001');
        if (!grups.has(clau)) grups.set(clau, []);
        grups.get(clau).push(f);
      });
      resultat = [];
      grups.forEach(function (membres) {
        resultat.push(visibles.map(function (c) {
          if (!c.agregat) return mostra(membres[0][clauDe(c)]);
          return aplicaAgregat(c.agregat, membres.map(function (f) { return f[clauDe(c)]; }));
        }));
      });
    }

    /* Ordenacio */
    (consulta.ordre || []).slice().reverse().forEach(function (o) {
      var idx = visibles.map(function (c) { return qualifica(consulta, c.nom); })
                        .indexOf(qualifica(consulta, o.camp));
      if (idx === -1) return;
      resultat.sort(function (a, b) {
        var x = a[idx] == null ? '' : a[idx], y = b[idx] == null ? '' : b[idx];
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (o.sentit === 'desc' ? -1 : 1);
      });
    });

    resultat = limita(resultat, consulta);

    return {
      columnes: columnes,
      files: resultat,
      registres: resultat.length,
      filesFiltrades: filtrades
    };
  }

  function etiquetaAgregat(c) {
    var a = AGREGATS[c.agregat];
    return (a ? a.etiqueta : c.agregat) + ' de ' + c.nom;
  }

  function mostra(v) {
    if (v === null) return '';
    return String(v).replace(/\s+$/, '');
  }

  function distintes(files) {
    var vistes = new Set(), fora = [];
    files.forEach(function (f) {
      var clau = f.join('');
      if (!vistes.has(clau)) { vistes.add(clau); fora.push(f); }
    });
    return fora;
  }

  /* --- Traduccio a SQL ----------------------------------------------------
     La pestanya SQL del programa. Serveix per llegir la consulta com un tot,
     i sobretot per veure on han quedat els parentesis.
     ------------------------------------------------------------------- */

  function sql(consulta) {
    var taules = taulesDe(consulta);
    if (!taules.length) return '';
    var visibles = (consulta.camps || []).filter(function (c) { return !c.ocult; });

    var seleccio;
    if (consulta.compteAsterisc) {
      seleccio = 'COUNT(*)';
    } else {
      seleccio = visibles.map(function (c) {
        if (!c.agregat) return c.nom;
        if (c.agregat === 'distinct-compte') return 'COUNT(DISTINCT ' + c.nom + ')';
        var f = { compte:'COUNT', minim:'MIN', maxim:'MAX', suma:'SUM', mitjana:'AVG' }[c.agregat];
        return f + '(' + c.nom + ')';
      }).join(', ') || '*';
    }

    var linies = ['SELECT ' + (consulta.registresUnics ? 'DISTINCT ' : '') + seleccio];
    linies.push('FROM ' + taules[0]);
    (consulta.enllacos || []).forEach(function (e) {
      var altra = taules.indexOf(e.taulaB) > taules.indexOf(e.taulaA) ? e.taulaB : e.taulaA;
      linies.push((e.tipus === 'totes-esq' ? 'LEFT JOIN ' : 'INNER JOIN ') + altra +
                  ' ON ' + e.taulaA + '.' + e.campA + ' = ' + e.taulaB + '.' + e.campB);
    });

    var on = sqlCriteris(consulta.criteris || [], consulta);
    if (on) linies.push('WHERE ' + on);

    var agrupadors = visibles.filter(function (c) { return !c.agregat; });
    if (visibles.some(function (c) { return c.agregat; }) && agrupadors.length) {
      linies.push('GROUP BY ' + agrupadors.map(function (c) {
        return taules.length > 1 ? qualifica(consulta, c.nom) : nomCurt(c.nom);
      }).join(', '));
    }
    if ((consulta.ordre || []).length) {
      linies.push('ORDER BY ' + consulta.ordre.map(function (o) {
        return o.camp + (o.sentit === 'desc' ? ' DESC' : '');
      }).join(', '));
    }
    return linies.join('\n');
  }

  function sqlCriteris(criteris, consulta) {
    if (!criteris.length) return '';
    var trossos = [], i = 0;
    while (i < criteris.length) {
      var g = criteris[i].grup;
      if (i > 0) trossos.push(criteris[i].connector === 'or' ? 'OR' : 'AND');
      if (g == null) {
        trossos.push(sqlCriteri(criteris[i], consulta));
        i++;
      } else {
        var dins = [];
        while (i < criteris.length && criteris[i].grup === g) {
          if (dins.length) dins.push(criteris[i].connector === 'or' ? 'OR' : 'AND');
          dins.push(sqlCriteri(criteris[i], consulta));
          i++;
        }
        trossos.push('(' + dins.join(' ') + ')');
      }
    }
    return trossos.join(' ');
  }

  function sqlCriteri(c, consulta) {
    var nomQ = qualifica(consulta, c.camp);
    var def = defDe(nomQ) || { tipus: 'Char' };
    var etiqueta = taulesDe(consulta).length > 1 ? nomQ : nomCurt(nomQ);
    var esData = def.tipus === 'Date';
    var lit = function (v) {
      if (esData) return "{d '" + v + "'}";
      if (esNumeric(def)) return String(v);
      return "'" + v + "'";
    };
    /* Un criteri amb parametre no ensenya cap valor a l'SQL: ensenya el nom
       del parametre precedit de dos punts, que es com el programa el escriu. */
    if (c.parametre) lit = function () { return ':' + c.parametre; };
    var v = c.parametre ? [':' + c.parametre, ':' + c.parametre] : (c.valors || []);
    var t;
    switch (c.operador) {
      case 'es-nul':    t = etiqueta + ' IS NULL'; break;
      case 'no-es-nul': t = etiqueta + ' IS NOT NULL'; break;
      case 'entre':     t = etiqueta + ' BETWEEN ' + lit(v[0]) + ' AND ' + lit(v[1]); break;
      case 'no-entre':  t = etiqueta + ' NOT BETWEEN ' + lit(v[0]) + ' AND ' + lit(v[1]); break;
      case 'llista':    t = etiqueta + ' IN(' + v.map(lit).join(',') + ')'; break;
      case 'no-en-la-llista': t = etiqueta + ' NOT IN(' + v.map(lit).join(',') + ')'; break;
      case 'comenca-per':    t = etiqueta + (c.parametre ? ' LIKE ' + lit() : " LIKE '" + v[0] + "%'"); break;
      case 'no-comenca-per': t = etiqueta + " NOT LIKE '" + v[0] + "%'"; break;
      case 'acaba-per':      t = etiqueta + " LIKE '%" + v[0] + "'"; break;
      case 'no-acaba-per':   t = etiqueta + " NOT LIKE '%" + v[0] + "'"; break;
      case 'inclou':         t = etiqueta + " LIKE '%" + v[0] + "%'"; break;
      case 'no-inclou':      t = etiqueta + " NOT LIKE '%" + v[0] + "%'"; break;
      case 'com':            t = etiqueta + " LIKE " + lit(v[0]); break;
      case 'no-es-com':      t = etiqueta + " NOT LIKE " + lit(v[0]); break;
      default:               t = etiqueta + ' ' + c.operador + ' ' + lit(v[0]);
    }
    return c.negat ? 'NOT (' + t + ')' : t;
  }

  /* Catalag de valors d'un camp: quins hi ha de debo i quantes files en te
     cadascun. Es el que a Click & Decide s'obte amb una consulta de registres
     unics, i sense aixo no es pot escriure cap criteri amb seguretat. */
  function valors(nomTaula, nomCamp) {
    var clau = nomTaula + '.' + nomCamp;
    var compte = new Map();
    files(nomTaula).forEach(function (f) {
      var v = f[clau];
      var net = v === null ? null : String(v).replace(/\s+$/, '');
      var k = net === null ? '\u0000' : net;
      if (!compte.has(k)) compte.set(k, { valor: net, files: 0 });
      compte.get(k).files++;
    });
    return Array.from(compte.values()).sort(function (a, b) {
      if (b.files !== a.files) return b.files - a.files;
      return String(a.valor) < String(b.valor) ? -1 : String(a.valor) > String(b.valor) ? 1 : 0;
    });
  }

  return {
    taula: taula, camp: camp, nomsTaules: nomsTaules, files: files, valors: valors,
    combinacio: combinacio, taulesDe: taulesDe, qualifica: qualifica,
    defDe: defDe, nomCurt: nomCurt,
    OPERADORS: OPERADORS, operador: operador, AGREGATS: AGREGATS,
    executa: executa, sql: sql, farceix: farceix,
    parametres: parametres, valorsDelCriteri: valorsDelCriteri
  };
})();
