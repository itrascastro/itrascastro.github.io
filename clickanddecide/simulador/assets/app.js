/* ---------------------------------------------------------------------------
   Interficie del laboratori.

   La consulta que construeix l'usuari viu en un sol objecte, i tota la
   pantalla es dibuixa a partir d'ell. Aixi el corrector rep exactament el
   mateix que s'esta veient.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var consulta = null;      // la consulta en construccio
  var exercici = null;      // l'exercici actual
  var conceptePreferit = null;
  var filaCriteriActiva = null;
  var marcador = { encerts: 0, fallades: 0 };

  var $ = function (id) { return document.getElementById(id); };

  /* --- Arrencada ---------------------------------------------------------- */

  function comenca() {
    /* La barra d'estat del programa descriu l'element que teniu a sota del
       cursor. Aqui fa el mateix: el title de cada control hi apareix. */
    document.addEventListener('mouseover', function (ev) {
      var e = ev.target.closest ? ev.target.closest('[title]') : null;
      var peu = $('peu-estat');
      if (!peu) return;
      peu.textContent = e && e.title ? e.title : 'A punt';
    });

    $('tanca-valors').addEventListener('click', function () { $('vel-valors').hidden = true; });
    $('valors-acord').addEventListener('click', function () { $('vel-valors').hidden = true; });

    $('btn-ordenacio').addEventListener('click', obreOrdenacio);
    $('cap-ordenacio').addEventListener('click', obreOrdenacio);
    $('tanca-ordenacio').addEventListener('click', cancellaOrdenacio);
    $('ordenacio-acord').addEventListener('click', function () {
      ordreAbans = null;
      $('vel-ordenacio').hidden = true;
    });
    $('ordenacio-cancella').addEventListener('click', cancellaOrdenacio);
    $('ordenacio-suprimeix').addEventListener('click', suprimeixOrdre);
    $('ordenacio-amunt').addEventListener('click', function () { mouOrdre(-1); });
    $('ordenacio-avall').addEventListener('click', function () { mouOrdre(1); });

    $('btn-executa').addEventListener('click', executa);
    $('btn-neteja').addEventListener('click', function () { novaConsulta(consulta.taules); });
    $('btn-criteris').addEventListener('click', obreCriteris);
    $('btn-propietats').addEventListener('click', obrePropietats);
    $('tanca-propietats').addEventListener('click', tancaPropietats);
    $('propietats-acord').addEventListener('click', tancaPropietats);
    $('tanca-criteris').addEventListener('click', cancellaCriteris);
    $('criteris-cancella').addEventListener('click', cancellaCriteris);
    $('criteris-acord').addEventListener('click', tancaCriteris);
    $('criteris-nou').addEventListener('click', afegeixCriteri);
    $('criteris-suprimeix').addEventListener('click', suprimeixCriteri);
    $('criteris-not').addEventListener('click', alternaNot);
    $('criteris-combina').addEventListener('click', combina);
    $('criteris-parametres').addEventListener('click', obreParametre);
    $('parametre-acord').addEventListener('click', acceptaParametre);
    $('parametre-cancella').addEventListener('click', function () { $('vel-parametre').hidden = true; });
    $('tanca-parametre').addEventListener('click', function () { $('vel-parametre').hidden = true; });
    $('parametre-treu').addEventListener('click', treuParametre);
    $('demana-acord').addEventListener('click', acceptaParametres);
    $('demana-cancella').addEventListener('click', function () {
      $('vel-demana').hidden = true; demanaDespres = null;
    });
    $('tanca-demana').addEventListener('click', function () {
      $('vel-demana').hidden = true; demanaDespres = null;
    });
    $('criteris-descombina').addEventListener('click', descombina);

    $('tria-columna').addEventListener('change', function () {
      if (criteriTriat == null) return;
      /* Sense camp, el criteri es perdria en tancar la finestra sense dir res.
         Un desplegable buit no pot esborrar el que ja hi havia. */
      if (!$('tria-columna').value) { pintaCriteris(); return; }
      consulta.criteris[criteriTriat].camp = $('tria-columna').value;
      pintaCriteris();
    });
    $('tria-operador').addEventListener('change', function () {
      if (criteriTriat == null) return;
      var c = consulta.criteris[criteriTriat];
      c.operador = $('tria-operador').value;
      var n = Motor.operador(c.operador).valors;
      if (n === 0) c.valors = [];
      else if (n === 2 && c.valors.length < 2) c.valors = [c.valors[0] || '', ''];
      else if (!c.valors.length) c.valors = [''];
      pintaCriteris();
    });
    $('desplega-valors').addEventListener('click', function () {
      if (criteriTriat == null) return;
      var p = parts(consulta.criteris[criteriTriat].camp);
      var def = Motor.camp(p.taula, p.camp);
      if (def) mostraValors(p.taula, def);
    });

    $('btn-corregeix').addEventListener('click', corregeix);
    $('btn-altre').addEventListener('click', function () { nouExercici(conceptePreferit); });
    $('conceptes').addEventListener('change', function () {
      conceptePreferit = $('conceptes').value || null;
      nouExercici(conceptePreferit);
    });
    $('btn-solucio').addEventListener('click', mostraSolucio);
    $('btn-reinicia').addEventListener('click', function () {
      marcador = { encerts: 0, fallades: 0 }; pintaMarcador();
    });

    document.querySelectorAll('#pestanyes button').forEach(function (b) {
      b.addEventListener('click', function () { canviaVista(b.dataset.vista); });
    });

    pintaMenus();
    pintaConceptes();
    pintaOrigens();
    /* Si s'hi arriba des del tutorial amb #ex=EX-06-2, es comenca per un
       exercici d'aquella unitat i es diu d'on es ve: el simulador genera els
       exercicis, no en guarda cap de fix, i sense dir-ho semblaria que ha
       obert una altra cosa. */
    var codi = /[#&]ex=([^&]+)/.exec(window.location.hash || '');
    var demanat = codi ? Exercicis.generaPerCodi(decodeURIComponent(codi[1])) : null;
    if (demanat) {
      posaExercici(demanat);
      avisDeProcedencia(decodeURIComponent(codi[1]), demanat.unitat);
    } else {
      if (codi) avisDeProcedencia(decodeURIComponent(codi[1]), null);
      nouExercici(null);
    }
  }

  /* --- Model de consulta --------------------------------------------------- */

  function novaConsulta(taules) {
    var llista = typeof taules === 'string' ? [taules] : (taules || []).slice();
    if (!llista.length) llista = [Motor.nomsTaules()[0]];
    consulta = {
      taules: llista,
      enllacos: [],
      camps: [],
      criteris: [],
      ordre: [],
      registresUnics: false,
      compteAsterisc: false,
      primersRegistres: '*',
      percentatge: false,
      liniesArea: ''
    };
    filaCriteriActiva = null;
    campTriat = null;             // una consulta nova no te cap camp actual
    pintaTot();
    pintaResultat(null);
    pintaPeu();
  }

  /* Amb una sola taula els camps es diuen pel seu nom, com al programa. Amb
     dues o mes cal dir de quina taula es cada camp. */
  function multitaula() { return consulta.taules.length > 1; }

  function nomDeCamp(taula, camp) { return multitaula() ? taula + '.' + camp : camp; }

  function parts(nomCamp) {
    var i = String(nomCamp).indexOf('.');
    if (i !== -1) return { taula: nomCamp.slice(0, i), camp: nomCamp.slice(i + 1) };
    return { taula: consulta.taules[0], camp: nomCamp };
  }

  /* Tots els camps disponibles, en l'ordre en que estan les taules. */
  function campsDisponibles() {
    var llista = [];
    consulta.taules.forEach(function (nom) {
      Motor.taula(nom).camps.forEach(function (def) {
        llista.push({ taula: nom, def: def, nom: nomDeCamp(nom, def.nom) });
      });
    });
    return llista;
  }

  function pintaTot() {
    pintaBarraTaules();
    pintaTaulesDisponibles();
    pintaTaulesTriades();
    pintaEnllacos();
    pintaCamps();
    pintaSql();
  }

  function pintaBarraTaules() {
    $('taules-actives').textContent = consulta.taules.join(' + ') +
      (multitaula() && !consulta.enllacos.length ? '   (sense enllaç)' : '');
  }

  /* Les tres pestanyes de baix: Taules, Consulta i SQL. */
  function canviaVista(quina) {
    ['taules', 'consulta', 'sql'].forEach(function (v) {
      $('pestanya-' + v).hidden = v !== quina;
    });
    document.querySelectorAll('#pestanyes button').forEach(function (b) {
      b.classList.toggle('actiu', b.dataset.vista === quina);
    });
    if (quina === 'sql') pintaSql();
    if (quina === 'taules') { pintaOrigens(); pintaTaulesDisponibles(); pintaTaulesTriades(); pintaEnllacos(); }
  }

  function campSeleccionat(nom) {
    return (consulta.camps || []).filter(function (c) { return c.nom === nom; })[0];
  }

  function alternaCamp(nom) {
    var i = consulta.camps.findIndex(function (c) { return c.nom === nom; });
    if (i === -1) consulta.camps.push({ nom: nom, agregat: null });
    else consulta.camps.splice(i, 1);
    campTriat = nom;              // el darrer camp tocat es el camp actual
    pintaCamps(); pintaSql();
  }

  function alternaOrdre(nom) {
    campTriat = nom;
    var i = consulta.ordre.findIndex(function (o) { return o.camp === nom; });
    if (i === -1) consulta.ordre.push({ camp: nom, sentit: 'asc' });
    else if (consulta.ordre[i].sentit === 'asc') consulta.ordre[i].sentit = 'desc';
    else consulta.ordre.splice(i, 1);
    pintaCamps(); pintaSql();
  }

  /* El menu del boto dret, amb les mateixes opcions que al programa:
     Criteri..., Ordena, Selecciona, Agrupa, Agregats, Distinct Agregats,
     Compte(*) i Propietats. */
  function menuCamp(nom, ancora) {
    tancaMenus();
    var menu = document.createElement('div');
    menu.className = 'menu-camp';

    function opcio(text, fn, marcada) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      if (marcada) b.className = 'marcada';
      b.addEventListener('click', function () { tancaMenus(); fn(); });
      menu.appendChild(b);
    }
    function separa() {
      var hr = document.createElement('div');
      hr.className = 'separa';
      menu.appendChild(hr);
    }

    var triat = campSeleccionat(nom);
    opcio('Criteri...', function () { obreCriteris(nom); });
    opcio('Ordena', function () { alternaOrdre(nom); },
          consulta.ordre.some(function (o) { return o.camp === nom; }));
    opcio('Selecciona', function () { alternaCamp(nom); }, !!triat);
    opcio('Agrupa', function () {
      /* Agrupar es deixar el camp seleccionat sense agregat: es el que fa que
         els altres camps s'agrupin per aquest. */
      if (!triat) alternaCamp(nom);
      var c = campSeleccionat(nom);
      if (c) { c.agregat = null; pintaCamps(); pintaSql(); }
    });
    separa();
    opcio('Agregats \u25B8', function () { menuAgregat(nom, rectangle(ancora), 'normal'); });
    opcio('Distinct Agregats \u25B8', function () { menuAgregat(nom, rectangle(ancora), 'distinct'); });
    opcio('Compte(*)', function () {
      consulta.compteAsterisc = !consulta.compteAsterisc;
      pintaCamps(); pintaSql();
    }, !!consulta.compteAsterisc);
    separa();
    opcio('Propietats', function () { campTriat = nom; obrePropietats(); });

    collocaMenu(menu, rectangle(ancora), false);
  }

  /* Col·loca un menu al costat del que l'ha obert i, si no hi cap, el gira o
     el desplaça perque quedi sencer dins de la finestra. Rep un RECTANGLE, no
     un element: quan un submenu s'obre, el boto que l'ha obert ja s'ha tret de
     la pagina i el seu rectangle valdria tot zeros, que es com el menu anava a
     parar al racó de dalt a l'esquerra. */
  function collocaMenu(menu, r, alCostat) {
    document.body.appendChild(menu);
    var ample = menu.offsetWidth;
    var alt = menu.offsetHeight;
    var marge = 6;
    var esq = alCostat ? r.right : r.left;
    var dalt = alCostat ? r.top : r.bottom;

    if (esq + ample > window.innerWidth - marge) {
      esq = alCostat ? r.left - ample : window.innerWidth - ample - marge;
    }
    if (esq < marge) esq = marge;
    if (dalt + alt > window.innerHeight - marge) {
      dalt = Math.max(marge, (alCostat ? r.bottom : r.top) - alt);
    }
    if (dalt < marge) dalt = marge;

    menu.style.left = (esq + window.scrollX) + 'px';
    menu.style.top = (dalt + window.scrollY) + 'px';
  }

  /* El rectangle d'un element, agafat ARA: qui obre un submenu l'ha de guardar
     abans de tancar el menu on era el boto. */
  function rectangle(e) {
    return e && e.getBoundingClientRect ? e.getBoundingClientRect() : e;
  }

  function tancaMenus() {
    document.querySelectorAll('.menu-camp').forEach(function (m) { m.remove(); });
    document.querySelectorAll('body > select').forEach(function (s) { s.remove(); });
  }

  /* Un clic a fora tanca els menus; un clic a dins d'un menu, no. Sense
     aquesta distincio, obrir un submenu el tancava en el mateix clic. */
  document.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('.menu-camp')) return;
    if (ev.target.closest && ev.target.closest('#cd-menus')) return;
    tancaMenus();
  });

  function menuAgregat(nom, ancora, quins) {
    var c = campSeleccionat(nom);
    if (!c) { alternaCamp(nom); c = campSeleccionat(nom); }

    var p = parts(nom);
    var def = Motor.camp(p.taula, p.camp) || {};
    var esNum = def.tipus === 'Integer' || def.tipus === 'Pack';

    /* El programa ensenya sempre la llista sencera i apaga el que no es pot
       fer amb aquell tipus de camp. Aixi es veu que existeix i per que no
       s'hi pot triar. */
    var menu = document.createElement('div');
    menu.className = 'menu-camp';
    Object.keys(Motor.AGREGATS).forEach(function (id) {
      var a = Motor.AGREGATS[id];
      if (a.menu !== (quins === 'distinct' ? 'Distinct Agregats' : 'Agregats')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.etiqueta;
      var potser = a.tipus === 'qualsevol' || (a.tipus === 'numeric' && esNum);
      if (!potser) {
        b.disabled = true;
        b.title = a.tipus === 'fora'
          ? 'Existeix al programa; aquest laboratori no el calcula.'
          : 'Nomes te sentit en un camp numeric, i ' + p.camp + ' es de tipus ' + def.tipus + '.';
      } else {
        b.addEventListener('click', function () {
          tancaMenus();
          var c = campSeleccionat(nom);
          if (!c) { alternaCamp(nom); c = campSeleccionat(nom); }
          if (c) { c.agregat = id; pintaCamps(); pintaSql(); }
        });
      }
      menu.appendChild(b);
    });

    var treu = document.createElement('div');
    treu.className = 'separa';
    menu.appendChild(treu);
    var cap = document.createElement('button');
    cap.type = 'button';
    cap.textContent = 'Cap agregat';
    cap.addEventListener('click', function () {
      tancaMenus();
      var c = campSeleccionat(nom);
      if (c) { c.agregat = null; pintaCamps(); pintaSql(); }
    });
    menu.appendChild(cap);

    collocaMenu(menu, rectangle(ancora), true);
  }

  /* --- Pintat de la llista de camps ---------------------------------------- */

  function pintaCamps() {
    var cos = $('llista-camps');
    cos.innerHTML = '';

    /* Al programa cada taula encapcala sempre els seus camps, amb la caixeta
       de replegar al davant, tant si n'hi ha una com si n'hi ha dues. */
    consulta.taules.forEach(function (nomTaula) {
      var cap = document.createElement('tr');
      cap.className = 'capcalera-taula';
      cap.dataset.taula = nomTaula;
      var td = document.createElement('td');
      td.colSpan = 8;
      td.innerHTML = '<span class="replega">&minus;</span>';
      td.appendChild(document.createTextNode(nomTaula));
      cap.appendChild(td);
      cos.appendChild(cap);
      pintaCampsDe(nomTaula, cos);
    });
  }

  function pintaCampsDe(nomTaula, cos) {
    var t = Motor.taula(nomTaula);

    t.camps.forEach(function (d) {
      var def = d;
      var nom = nomDeCamp(nomTaula, def.nom);
      var tr = document.createElement('tr');
      var sel = campSeleccionat(nom);
      var ord = consulta.ordre.filter(function (o) { return o.camp === nom; })[0];
      var teCriteri = consulta.criteris.some(function (c) { return c.camp === nom; });
      if (sel) tr.className = 'marcada';

      /* La columna de criteris no mostra una marca generica: mostra
         l'OPERADOR del criteri aplicat. A les captures del programa s'hi veu
         un "=" al camp filtrat per igualtat. */
      var criterisDelCamp = consulta.criteris.filter(function (c) { return c.camp === nom; });
      tr.appendChild(cel('mini', boto('control lupa' + (teCriteri ? ' on' : ''),
        marcaCriteri(criterisDelCamp), function () {
          obreCriteris(nom);
        }, criterisDelCamp.length
             ? criterisDelCamp.map(function (c) { return Motor.operador(c.operador).etiqueta; }).join(' i ')
             : 'Criteris sobre ' + nom)));

      /* El programa no hi posa fletxes: hi posa les mateixes barretes de la
         capcalera, creixents si l'ordre es ascendent i decreixents si es
         descendent. */
      var bOrdre = boto('control ordre' + (ord ? ' on' : ''), '', function () {
        alternaOrdre(nom);
      }, ord
           ? (ord.sentit === 'asc'
                ? 'Ordre ascendent: de la A a la Z o del 0 al 9'
                : 'Ordre descendent: de la Z a la A o del 9 al 0')
           : 'Ordena per ' + nom);
      if (ord) {
        bOrdre.innerHTML = '<span class="barres ' + (ord.sentit === 'asc' ? 'puja' : 'baixa') +
                           '"><i></i><i></i><i></i></span>';
      }
      tr.appendChild(cel('mini', bOrdre));

      var marca = sel ? (sel.ocult ? '·' : (sel.agregat ? 'Σ' : '✓')) : '';
      var b = boto('control' + (sel ? ' on' : '') + (sel && sel.ocult ? ' ocult' : ''), marca, function (ev) {
        if (ev.shiftKey) menuAgregat(nom, ev.target);
        else alternaCamp(nom);
      }, 'Selecciona ' + nom + '. Amb Maj, agregat.');
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); menuCamp(nom, ev.target); });
      tr.addEventListener('contextmenu', function (ev) {
        if (ev.target.tagName === 'BUTTON') return;
        ev.preventDefault(); campTriat = nom; menuCamp(nom, ev.target);
      });
      tr.appendChild(cel('mini', b));

      /* El nom del camp obre el seu catalag de valors. Sense saber que hi ha
         a dins d'un camp no es pot escriure cap criteri amb seguretat, i es
         la primera cosa que es fa davant d'una taula desconeguda. */
      var nomCel = boto('nom-camp enllac', def.nom, function () {
        mostraValors(nomTaula, def);
      }, 'Quins valors hi ha a ' + def.nom);
      tr.appendChild(cel('nom-camp', nomCel));
      if (nom === campTriat) tr.classList.add('seleccionada');

      /* Els camps triats es reordenen arrossegant-los, com al programa. */
      if (sel) {
        tr.draggable = true;
        tr.addEventListener('dragstart', function (ev) {
          ev.dataTransfer.setData('text/camp', nom);
        });
        tr.addEventListener('dragover', function (ev) { ev.preventDefault(); });
        tr.addEventListener('drop', function (ev) {
          ev.preventDefault();
          var quin = ev.dataTransfer.getData('text/camp');
          if (!quin || quin === nom) return;
          var de = consulta.camps.findIndex(function (c) { return c.nom === quin; });
          var a = consulta.camps.findIndex(function (c) { return c.nom === nom; });
          if (de === -1 || a === -1) return;
          consulta.camps.splice(a, 0, consulta.camps.splice(de, 1)[0]);
          pintaCamps(); pintaSql();
        });
      }
      /* Tocar qualsevol cosa de la fila fa que aquell sigui el camp actual.
         Abans nomes comptava clicar fora dels controls, i per aixo qui
         marcava un camp amb les ulleres i despres obria Consulta > Agregats
         es trobava un avis dient que no havia triat cap camp. */
      tr.addEventListener('click', function (ev) {
        campTriat = nom;
        if (ev.target.tagName === 'BUTTON') return;   // el boto ja fa el seu
        pintaCamps();
      });
      tr.appendChild(cel('tipus-camp', document.createTextNode(def.tipus)));
      tr.appendChild(cel('tipus-camp', document.createTextNode(String(def.longitud))));
      tr.appendChild(cel('tipus-camp', document.createTextNode(String(def.decimals == null ? 0 : def.decimals))));
      tr.appendChild(cel('tipus-camp', document.createTextNode(def.descripcio || '')));
      cos.appendChild(tr);
    });
  }

  /* Simbol que la columna de la lupa ensenya per a cada operador.

     Dos estan comprovats contra el programa real: l'igual surt com a "=" i la
     llista com a "[..]". La resta son conveniencia d'aqui: mentre no es vegin
     al programa, el que val es el text que surt en passar-hi per sobre, que
     sempre porta el nom sencer de l'operador. */
  var SIMBOL = {
    '=': '=', '<>': '≠', '>': '>', '>=': '≥', '<': '<', '<=': '≤',
    'llista': '[..]', 'no-en-la-llista': '[..]',
    'es-nul': '∅', 'no-es-nul': '∅', 'entre': '↔', 'no-entre': '↔',
    'comenca-per': 'a‥', 'no-comenca-per': 'a‥',
    'acaba-per': '‥a', 'no-acaba-per': '‥a',
    'inclou': '‥a‥', 'no-inclou': '‥a‥', 'com': '~', 'no-es-com': '~'
  };

  /* Els operadors comprovats s'ensenyen tal com son, sense afegir-hi res. */
  var COMPROVATS = ['=', 'llista', 'no-en-la-llista'];

  function marcaCriteri(criteris) {
    if (!criteris.length) return '';
    if (criteris.length > 1) return '⋯';
    var c = criteris[0];
    var s = SIMBOL[c.operador] || '=';
    if (COMPROVATS.indexOf(c.operador) !== -1) return s;
    return c.operador.indexOf('no-') === 0 ? '¬' + s : s;
  }

  function cel(classe, fill) {
    var td = document.createElement('td');
    if (classe) td.className = classe;
    td.appendChild(fill);
    return td;
  }

  function boto(classe, text, fn, titol) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = classe; b.textContent = text;
    if (titol) b.title = titol;
    b.addEventListener('click', fn);
    return b;
  }


  /* --- Els valors que existeixen en un camp -------------------------------- */

  function mostraValors(nomTaula, def) {
    var llista = Motor.valors(nomTaula, def.nom);
    var total = Motor.taula(nomTaula).files.length;

    $('titol-valors').firstChild.nodeValue = 'Valors de ' + def.nom + ' ';
    $('nota-valors').innerHTML = '<b>' + llista.length + '</b> valors diferents en ' + total +
      ' files. És el mateix que obtindríeu amb una consulta d\'aquest camp sol i <b>Registres únics</b> ' +
      'a Sí. Amb <b>Agregats &rarr; Compte</b> hi afegiríeu el recompte de cada valor.';

    var t = document.createElement('table');
    t.className = 'resultat';
    t.innerHTML = '<thead><tr><th>' + def.nom + '</th><th>Files</th></tr></thead>';
    var cos = document.createElement('tbody');
    llista.slice(0, 200).forEach(function (v) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td');
      if (v.valor === null) { td1.textContent = '(nul)'; td1.className = 'tipus-camp'; }
      else if (v.valor === '') { td1.textContent = '(buit: només espais)'; td1.className = 'tipus-camp'; }
      else td1.textContent = v.valor;
      var td2 = document.createElement('td');
      td2.textContent = v.files;
      tr.appendChild(td1); tr.appendChild(td2);
      cos.appendChild(tr);
    });
    t.appendChild(cos);
    var zona = $('taula-valors');
    zona.innerHTML = '';
    zona.appendChild(t);
    if (llista.length > 200) {
      var avis = document.createElement('p');
      avis.className = 'nota';
      avis.textContent = 'Se n\'ensenyen 200 de ' + llista.length + '.';
      zona.appendChild(avis);
    }
    $('vel-valors').hidden = false;
  }

  /* --- La barra de menus ---------------------------------------------------
     El programa en te vuit. Aqui nomes n'hi ha un que faci coses, el de
     Consulta, i te les mateixes entrades que alla; les que el laboratori no
     fa surten apagades, no amagades, perque qui despres obri el Builder les
     reconegui.
     ---------------------------------------------------------------------- */

  var MENUS = [
    { nom: 'Fitxer', fora: 'projectes i fitxers' },
    { nom: 'Edició', fora: 'copiar i enganxar' },
    { nom: 'Visualització', fora: 'barres i panells' },
    { nom: 'Consulta', entrades: [
        { text: 'Executa', fes: function () { executa(); } },
        { text: 'Executa en mode "Batch"...', fora: true },
        { text: 'Atura', fora: true },
        { separa: true },
        { text: 'Insereix', submenu: [
            { text: 'Fórmula...', fora: true },
            { text: 'Agregats', submenu: 'agregats' },
            { text: 'Distinct Agregats', submenu: 'distinct' },
            { text: 'Compte(*)', fes: function () {
                consulta.compteAsterisc = !consulta.compteAsterisc;
                pintaCamps(); pintaSql();
              } }
          ] },
        { text: 'Camp', fora: true },
        { text: 'Union', fora: true },
        { separa: true },
        { text: 'Criteris...', fes: function () { obreCriteris(); } },
        { text: 'Ordena per...', fes: function () { obreOrdenacio(); } },
        { text: 'Agregats...', fes: function (r) {
            var quin = campActual();
            if (!quin) { avisMenu('Marqueu abans un camp amb la columna de les ulleres.'); return; }
            menuAgregat(quin, r, 'normal');
          } },
        { separa: true },
        { text: 'Paràmetres...', fes: function () {
            if (!Motor.parametres(consulta).length) {
              avisMenu('Aquesta consulta no té cap paràmetre. Se n\'afegeix un des de ' +
                       '<b>Criteris</b>, amb el botó <b>Paràmetres...</b>.');
              return;
            }
            demanaParametres(function () {});
          } },
        { separa: true },
        { text: 'Crea SQL Nadiu', fora: true },
        { text: 'Crea Informe...', fora: true },
        { text: 'Crea Cub...', fora: true },
        { separa: true },
        { text: 'Actualitza les taules', fora: true }
      ] },
    { nom: 'Format', fora: 'format de les columnes' },
    { nom: 'Eines', fora: 'opcions del programa' },
    { nom: 'Finestra', fora: 'finestres obertes' },
    { nom: 'Ajuda', fora: 'ajuda del programa' }
  ];

  function pintaMenus() {
    var barra = $('cd-menus');
    barra.innerHTML = '';
    MENUS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = m.nom;
      if (m.fora) {
        b.className = 'fora';
        b.title = 'Al programa hi ha ' + m.fora + '. Aquest laboratori nomes fa consultes.';
        b.addEventListener('click', function () {
          avisMenu('El menú <b>' + m.nom + '</b> del programa serveix per a ' + m.fora +
                   '. Aquest laboratori només fa consultes, i per això només hi ha el de Consulta.');
        });
      } else {
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          tancaMenus();
          obreMenu(m.entrades, b);
        });
      }
      barra.appendChild(b);
    });
  }

  /* El camp sobre el qual actuen les opcions de menu. Es el darrer que s'ha
     tocat a la graella; si encara no se n'ha tocat cap pero la consulta ja en
     porta algun, val el darrer que s'hi ha afegit. Nomes queda sense resposta
     quan la consulta es buida del tot. */
  function campActual() {
    if (campTriat) return campTriat;
    var tria = consulta.camps[consulta.camps.length - 1];
    return tria ? tria.nom : null;
  }

  function avisMenu(html) {
    var p = document.createElement('div');
    p.className = 'avis-menu';
    p.innerHTML = html;
    document.body.appendChild(p);
    setTimeout(function () { p.remove(); }, 4200);
  }

  function obreMenu(entrades, ancora, desplacament) {
    var menu = document.createElement('div');
    menu.className = 'menu-camp';
    entrades.forEach(function (e) {
      if (e.separa) {
        var hr = document.createElement('div');
        hr.className = 'separa';
        menu.appendChild(hr);
        return;
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = e.text + (e.submenu ? '  \u25B8' : '');
      if (e.fora) {
        b.disabled = true;
        b.title = 'Existeix al programa; aquest laboratori no ho fa.';
      } else if (e.submenu) {
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (typeof e.submenu === 'string') {
            var quin = campActual();
            var on = b.getBoundingClientRect();     // abans de treure el menu
            if (!quin) {
              tancaMenus();
              avisMenu('Marqueu abans un camp amb la columna de les ulleres.');
              return;
            }
            tancaMenus();
            menuAgregat(quin, on, e.submenu === 'distinct' ? 'distinct' : 'normal');
          } else {
            obreMenu(e.submenu, b, true);
          }
        });
      } else {
        b.addEventListener('click', function () {
          var on = b.getBoundingClientRect();      // abans de treure el menu
          tancaMenus();
          e.fes(on);
        });
      }
      menu.appendChild(b);
    });
    collocaMenu(menu, rectangle(ancora), !!desplacament);
  }

  /* --- Pestanya Taules -----------------------------------------------------
     Al Builder les taules no es trien en cap finestra a part: es fa a la
     pestanya "Taules", que te tres zones. A dalt a l'esquerra els origens de
     dades, a la dreta les taules d'aquell origen, i a sota les que s'han
     arrossegat a la consulta. La franja del final es la dels enllacos, i al
     programa diu "Feu clic aqui per veure la llista d'enllacos".
     ---------------------------------------------------------------------- */

  var origenTriat = 'MODEL_TOT';

  /* Els origens que surten al video. Nomes MODEL_TOT porta taules: els altres
     hi son perque la pantalla real els ensenya i convé reconeixer-los. */
  var ORIGENS = ['EPOCA_CH_MODEL', 'EPOCA_DS_MODEL', 'Local Database',
                 'MODEL_TOT', 'WEB_EPOCA_DS_MODEL', 'WEB_MODEL_TOT'];

  function pintaOrigens() {
    var ul = $('llista-origens');
    ul.innerHTML = '';
    ORIGENS.forEach(function (nom) {
      var li = document.createElement('li');
      li.textContent = nom;
      if (nom === origenTriat) li.className = 'triat';
      li.addEventListener('click', function () {
        origenTriat = nom;
        pintaOrigens(); pintaTaulesDisponibles();
      });
      ul.appendChild(li);
    });
  }

  function pintaTaulesDisponibles() {
    var cos = $('llista-taules-disponibles');
    cos.innerHTML = '';
    if (origenTriat !== 'MODEL_TOT') {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 2;
      td.className = 'tipus-camp';
      td.textContent = 'Aquest origen no té taules en aquest laboratori. El de sempre és MODEL_TOT.';
      tr.appendChild(td); cos.appendChild(tr);
      return;
    }
    Motor.nomsTaules().forEach(function (nom) {
      var t = Motor.taula(nom);
      var tr = document.createElement('tr');
      if (consulta.taules.indexOf(nom) !== -1) tr.className = 'marcada';
      var td1 = document.createElement('td');
      td1.textContent = nom;
      var td2 = document.createElement('td');
      td2.style.whiteSpace = 'normal';
      td2.textContent = t.files.length + ' files · ' +
        (t.clau ? 'una per ' + t.clau : 'registres múltiples');
      tr.appendChild(td1); tr.appendChild(td2);
      tr.title = 'Arrossegueu-la cap avall, o feu-hi doble clic per afegir-la i anar a la consulta';
      tr.draggable = true;
      tr.addEventListener('dragstart', function (ev) {
        ev.dataTransfer.setData('text/plain', nom);
      });
      /* Com al programa: el doble clic afegeix la taula i salta a la pestanya
         de la consulta; arrossegant-la, en canvi, us quedeu a Taules. */
      tr.addEventListener('dblclick', function () {
        afegeixTaula(nom);
        canviaVista('consulta');
      });
      cos.appendChild(tr);
    });
  }

  function pintaTaulesTriades() {
    var zona = $('taules-triades');
    zona.innerHTML = '';
    consulta.taules.forEach(function (nom) {
      var caixa = document.createElement('div');
      caixa.className = 'taula-triada';
      var cap = document.createElement('header');
      cap.title = 'Feu-hi clic i premeu Supr, o feu servir la creu, per treure-la de la consulta';
      cap.tabIndex = 0;
      var titol = document.createElement('span');
      titol.textContent = nom;
      cap.appendChild(titol);
      var creu = document.createElement('button');
      creu.type = 'button';
      creu.className = 'treu';
      creu.textContent = '\u00D7';
      creu.title = 'Treu ' + nom + ' de la consulta';
      creu.addEventListener('click', function (ev) { ev.stopPropagation(); treuTaula(nom); });
      cap.appendChild(creu);
      cap.addEventListener('keydown', function (ev) {
        if (ev.key === 'Delete' || ev.key === 'Backspace') treuTaula(nom);
      });
      caixa.appendChild(cap);
      var llista = document.createElement('div');
      llista.className = 'camps-mini';
      Motor.taula(nom).camps.forEach(function (d) {
        var l = document.createElement('div');
        l.textContent = d.nom;
        llista.appendChild(l);
      });
      caixa.appendChild(llista);
      zona.appendChild(caixa);
    });
    if (!consulta.taules.length) {
      zona.innerHTML = '<p class="buit">Arrossegueu-hi una taula de la llista de dalt, ' +
                       'o feu-hi doble clic.</p>';
    }
    zona.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      zona.classList.add('rebent');
    });
    zona.addEventListener('dragleave', function () { zona.classList.remove('rebent'); });
    zona.addEventListener('drop', function (ev) {
      ev.preventDefault();
      zona.classList.remove('rebent');
      var nom = ev.dataTransfer.getData('text/plain');
      if (nom) afegeixTaula(nom);
    });
  }

  function afegeixTaula(nom) {
    if (consulta.taules.indexOf(nom) !== -1) return;
    consulta.taules.push(nom);
    reanomenaCamps();
    pintaTot();
  }

  function treuTaula(nom) {
    if (consulta.taules.length === 1) return;
    if (campTriat && parts(campTriat).taula === nom) campTriat = null;
    consulta.taules = consulta.taules.filter(function (t) { return t !== nom; });
    consulta.enllacos = consulta.enllacos.filter(function (e) {
      return e.taulaA !== nom && e.taulaB !== nom;
    });
    reanomenaCamps();
    pintaTot();
  }

  function reanomenaCamps() {
    function refes(nomCamp) {
      var p = parts(nomCamp);
      return consulta.taules.indexOf(p.taula) === -1 ? null : nomDeCamp(p.taula, p.camp);
    }
    consulta.camps = consulta.camps.filter(function (c) {
      var n = refes(c.nom); if (n) c.nom = n; return !!n;
    });
    consulta.criteris = consulta.criteris.filter(function (c) {
      var n = refes(c.camp); if (n) c.camp = n; return !!n;
    });
    consulta.ordre = consulta.ordre.filter(function (o) {
      var n = refes(o.camp); if (n) o.camp = n; return !!n;
    });
  }

  /* --- La franja dels enllacos --------------------------------------------- */

  function pintaEnllacos() {
    var zona = $('franja-enllacos');
    zona.innerHTML = '';

    if (consulta.taules.length < 2) {
      zona.innerHTML = '<p class="buit">Amb una sola taula no cal cap enllaç.</p>';
      return;
    }

    var cap = document.createElement('div');
    cap.className = 'titol-panell';
    cap.textContent = 'Llista d\'enllaços';
    zona.appendChild(cap);

    consulta.enllacos.forEach(function (e, i) {
      var fila = document.createElement('div');
      fila.className = 'fila-enllac';
      fila.appendChild(triaTaula(e, 'taulaA', 'campA'));
      fila.appendChild(triaCamp(e, 'taulaA', 'campA'));
      var fletxa = document.createElement('span');
      fletxa.className = 'fletxa';
      fletxa.textContent = '→';
      fila.appendChild(fletxa);
      fila.appendChild(triaTaula(e, 'taulaB', 'campB'));
      fila.appendChild(triaCamp(e, 'taulaB', 'campB'));

      var tipus = document.createElement('select');
      [['coincidents', 'Només les coincidents'],
       ['totes-esq', 'Totes les de ' + e.taulaA]].forEach(function (o) {
        var op = document.createElement('option');
        op.value = o[0]; op.textContent = o[1];
        if (e.tipus === o[0]) op.selected = true;
        tipus.appendChild(op);
      });
      tipus.addEventListener('change', function () { e.tipus = tipus.value; pintaTot(); });
      fila.appendChild(tipus);

      var treu = document.createElement('button');
      treu.type = 'button';
      treu.textContent = 'Suprimeix';
      treu.addEventListener('click', function () {
        consulta.enllacos.splice(i, 1); pintaTot();
      });
      fila.appendChild(treu);
      zona.appendChild(fila);
    });

    var nou = document.createElement('button');
    nou.type = 'button';
    nou.className = 'boto-enllac';
    nou.textContent = consulta.enllacos.length ? 'Enllaç nou' : 'Feu clic aquí per definir un enllaç';
    nou.addEventListener('click', afegeixEnllac);
    zona.appendChild(nou);

    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.innerHTML = consulta.enllacos.length
      ? '<b>Només les coincidents</b> deixa fora les files que no troben parella. ' +
        '<b>Totes les de la primera</b> les conserva amb els camps de l\'altra taula buits: ' +
        'és l\'única manera de veure què no casa.'
      : 'Heu triat més d\'una taula i encara no les heu unides. Sense enllaç, cada fila d\'una ' +
        'taula es combinaria amb totes les de l\'altra, i la consulta s\'aturarà i us ho dirà.';
    zona.appendChild(nota);
  }

  function afegeixEnllac() {
    if (consulta.taules.length < 2) return;
    var a = consulta.taules[0], b = consulta.taules[1];
    consulta.enllacos.push({
      taulaA: a, campA: Motor.taula(a).camps[0].nom,
      taulaB: b, campB: Motor.taula(b).camps[0].nom,
      tipus: 'coincidents'
    });
    pintaTot();
  }

  function triaTaula(enllac, clauTaula, clauCamp) {
    var sel = document.createElement('select');
    consulta.taules.forEach(function (nom) {
      var o = document.createElement('option');
      o.value = nom; o.textContent = nom;
      if (enllac[clauTaula] === nom) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      enllac[clauTaula] = sel.value;
      enllac[clauCamp] = Motor.taula(sel.value).camps[0].nom;
      pintaTot();
    });
    return sel;
  }

  function triaCamp(enllac, clauTaula, clauCamp) {
    var sel = document.createElement('select');
    Motor.taula(enllac[clauTaula]).camps.forEach(function (def) {
      var o = document.createElement('option');
      o.value = def.nom; o.textContent = def.nom;
      if (enllac[clauCamp] === def.nom) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { enllac[clauCamp] = sel.value; pintaSql(); });
    return sel;
  }

  /* --- Finestra d'Ordenacio -------------------------------------------------
     Al programa s'obre clicant la capçalera de la columna de les ratlletes, i
     serveix per veure d'un cop d'ull per quins camps s'ordena, canviar quin
     s'aplica primer i treure'n algun.
     ---------------------------------------------------------------------- */

  var ordreTriat = null;

  /* Copia de l'ordre al moment d'obrir la finestra: la finestra de debo te
     Cancel·la i, si el premeu, no es queda res del que hi hagueu tocat. */
  var ordreAbans = null;

  function obreOrdenacio() {
    ordreTriat = consulta.ordre.length ? 0 : null;
    ordreAbans = consulta.ordre.map(function (o) { return { camp: o.camp, sentit: o.sentit }; });
    pintaOrdenacio();
    $('vel-ordenacio').hidden = false;
  }

  function cancellaOrdenacio() {
    if (ordreAbans) consulta.ordre = ordreAbans;
    ordreAbans = null;
    $('vel-ordenacio').hidden = true;
    pintaCamps(); pintaSql();
  }

  function pintaOrdenacio() {
    var zona = $('llista-ordre');
    zona.innerHTML = '';
    /* La finestra del programa es una taula amb Nom, Tipus i Descripcio, i
       cada fila duu al davant les barretes que diuen en quin sentit ordena. */
    if (consulta.ordre.length) {
      var cap = document.createElement('div');
      cap.className = 'fila-ordre capcalera';
      cap.innerHTML = '<span class="nom">Nom</span>' +
                      '<span class="tipus">Tipus</span>' +
                      '<span class="descripcio">Descripció</span>' +
                      '<span class="descendent">Descendent</span>';
      zona.appendChild(cap);
    }
    consulta.ordre.forEach(function (o, i) {
      var fila = document.createElement('div');
      fila.className = 'fila-ordre' + (i === ordreTriat ? ' triada' : '');
      var p = parts(o.camp);
      var def = Motor.camp(p.taula, p.camp) || {};
      var nom = document.createElement('span');
      nom.className = 'nom';
      nom.textContent = p.camp;
      var tipus = document.createElement('span');
      tipus.className = 'tipus';
      tipus.textContent = def.tipus || '';
      var descripcio = document.createElement('span');
      descripcio.className = 'descripcio';
      descripcio.textContent = def.descripcio || '';
      var simbol = document.createElement('button');
      simbol.type = 'button';
      simbol.className = 'simbol';
      simbol.innerHTML = '<span class="barres ' + (o.sentit === 'desc' ? 'baixa' : 'puja') +
                         '"><i></i><i></i><i></i></span>';
      simbol.title = o.sentit === 'desc'
        ? 'Ordre descendent: de la Z a la A o del 9 al 0'
        : 'Ordre ascendent: de la A a la Z o del 0 al 9';
      simbol.addEventListener('click', function (ev) {
        ev.stopPropagation();
        o.sentit = o.sentit === 'desc' ? 'asc' : 'desc';
        pintaOrdenacio(); pintaCamps(); pintaSql();
      });
      /* La quarta columna de la finestra: un desplegable Si/No que es la
         manera de debo de capgirar el sentit. */
      var desc = document.createElement('select');
      desc.className = 'descendent';
      [['no', 'No'], ['si', 'Sí']].forEach(function (o) {
        var op = document.createElement('option');
        op.value = o[0]; op.textContent = o[1];
        desc.appendChild(op);
      });
      desc.value = o.sentit === 'desc' ? 'si' : 'no';
      desc.addEventListener('click', function (ev) { ev.stopPropagation(); });
      desc.addEventListener('change', function () {
        o.sentit = desc.value === 'si' ? 'desc' : 'asc';
        pintaOrdenacio(); pintaCamps(); pintaSql();
      });

      fila.appendChild(simbol); fila.appendChild(nom);
      fila.appendChild(tipus); fila.appendChild(descripcio);
      fila.appendChild(desc);
      fila.addEventListener('click', function () { ordreTriat = i; pintaOrdenacio(); });
      zona.appendChild(fila);
    });
    if (!consulta.ordre.length) {
      zona.innerHTML = '<p class="buit">Aquesta consulta no ordena per cap camp.</p>';
    }
    $('nota-ordenacio').innerHTML = 'El primer de la llista mana; els altres només desempaten ' +
      'dins dels valors iguals. <b>L\'ordre no s\'aplica fins que torneu a executar.</b>';
  }

  function mouOrdre(cap) {
    if (ordreTriat == null) return;
    var j = ordreTriat + cap;
    if (j < 0 || j >= consulta.ordre.length) return;
    var tros = consulta.ordre.splice(ordreTriat, 1)[0];
    consulta.ordre.splice(j, 0, tros);
    ordreTriat = j;
    pintaOrdenacio(); pintaCamps(); pintaSql();
  }

  function suprimeixOrdre() {
    if (ordreTriat == null) return;
    consulta.ordre.splice(ordreTriat, 1);
    ordreTriat = consulta.ordre.length ? Math.max(0, ordreTriat - 1) : null;
    pintaOrdenacio(); pintaCamps(); pintaSql();
  }


  /* --- Finestra de criteris -------------------------------------------------
     Es com la del programa: a dalt es tria UN criteri (columna, operador i
     valor) i a sota, al panell "Camps", s'hi van acumulant tots. Clicant una
     linia del panell es torna a carregar a dalt per modificar-la.
     ---------------------------------------------------------------------- */

  var campTriat = null;             // camp seleccionat a la graella
  var criteriTriat = null;          // index dins de consulta.criteris
  var triatsPerCombinar = [];

  function obreCriteris(campInicial) {
    if (typeof campInicial === 'string') {
      var jaHi = consulta.criteris.map(function (c) { return c.camp; }).indexOf(campInicial);
      if (jaHi !== -1) criteriTriat = jaHi;
      else { consulta.criteris.push(nouCriteri(campInicial)); criteriTriat = consulta.criteris.length - 1; }
    } else if (!consulta.criteris.length) {
      consulta.criteris.push(nouCriteri());
      criteriTriat = 0;
    } else if (criteriTriat == null || criteriTriat >= consulta.criteris.length) {
      criteriTriat = 0;
    }
    triatsPerCombinar = [];
    copiaAbans = JSON.parse(JSON.stringify(consulta.criteris));
    pintaCriteris();
    $('vel-criteris').hidden = false;
  }

  var copiaAbans = null;

  function tancaCriteris() {
    /* Un criteri sense camp es un criteri a mig fer: es treu, pero nomes
       aquest, i la resta es queda tal com esta. */
    consulta.criteris = consulta.criteris.filter(function (c) { return c.camp; });
    $('vel-criteris').hidden = true;
    avisCriteris('');
    pintaCamps(); pintaSql();
  }

  function cancellaCriteris() {
    if (copiaAbans) consulta.criteris = copiaAbans;
    $('vel-criteris').hidden = true;
    avisCriteris('');
    pintaCamps(); pintaSql();
  }

  function nouCriteri(camp) {
    return {
      camp: camp || campsDisponibles()[0].nom,
      operador: '=',
      valors: [''],
      connector: consulta.criteris.length ? 'and' : null,
      grup: null,
      negat: false
    };
  }

  function afegeixCriteri() {
    var base = criteriTriat != null ? consulta.criteris[criteriTriat] : null;
    consulta.criteris.push(nouCriteri(base ? base.camp : null));
    criteriTriat = consulta.criteris.length - 1;
    triatsPerCombinar = [];
    pintaCriteris();
  }

  function suprimeixCriteri() {
    if (criteriTriat == null) return;
    consulta.criteris.splice(criteriTriat, 1);
    if (consulta.criteris.length && consulta.criteris[0].connector) consulta.criteris[0].connector = null;
    criteriTriat = consulta.criteris.length ? Math.max(0, criteriTriat - 1) : null;
    triatsPerCombinar = [];
    pintaCriteris();
  }

  function alternaNot() {
    if (criteriTriat == null) return;
    var c = consulta.criteris[criteriTriat];
    c.negat = !c.negat;
    pintaCriteris();
  }

  /* Un parentesi tanca un tros seguit de la llista: files saltejades no en
     poden formar part, i el programa tampoc ho permetria. */
  function combina() {
    if (triatsPerCombinar.length < 2) return;
    var ordenades = triatsPerCombinar.slice().sort(function (a, b) { return a - b; });
    var seguides = ordenades.every(function (v, k) { return k === 0 || v === ordenades[k - 1] + 1; });
    if (!seguides) {
      avisCriteris('Les files que combineu han de ser <b>seguides</b>. Un parèntesi agrupa un tros ' +
                   'continu de la llista: no en pot deixar una fora pel mig.');
      return;
    }
    var g = 1 + Math.max(0, ...consulta.criteris.map(function (c) { return c.grup || 0; }));
    ordenades.forEach(function (i) { consulta.criteris[i].grup = g; });
    triatsPerCombinar = [];
    avisCriteris('');
    pintaCriteris();
  }

  function descombina() {
    avisCriteris('');
    var afectats = triatsPerCombinar.length ? triatsPerCombinar
                 : (criteriTriat != null ? [criteriTriat] : []);
    afectats.forEach(function (i) {
      var g = consulta.criteris[i].grup;
      if (g != null) consulta.criteris.forEach(function (c) { if (c.grup === g) c.grup = null; });
    });
    triatsPerCombinar = [];
    pintaCriteris();
  }

  function avisCriteris(html) {
    var p = $('avis-criteris');
    p.innerHTML = html;
    p.hidden = !html;
  }

  /* --- Dibuix de la finestra ------------------------------------------------ */

  function pintaCriteris() {
    pintaEditorCriteri();
    pintaPanellCamps();
    actualitzaBotonsCriteris();
    pintaSql();
  }

  function pintaEditorCriteri() {
    var c = criteriTriat != null ? consulta.criteris[criteriTriat] : null;

    var selCamp = $('tria-columna');
    selCamp.innerHTML = '';
    campsDisponibles().forEach(function (d) {
      var o = document.createElement('option');
      o.value = d.nom;
      o.textContent = d.taula + '.' + d.def.nom;
      if (c && d.nom === c.camp) o.selected = true;
      selCamp.appendChild(o);
    });
    selCamp.disabled = !c;

    var selOp = $('tria-operador');
    selOp.innerHTML = '';
    Motor.OPERADORS.forEach(function (op) {
      var o = document.createElement('option');
      o.value = op.id; o.textContent = op.etiqueta;
      if (c && op.id === c.operador) o.selected = true;
      selOp.appendChild(o);
    });
    selOp.disabled = !c;

    var caixes = $('caixes-valor');
    caixes.innerHTML = '';
    if (!c) return;

    /* Un criteri lligat a un parametre no te valor escrit: el valor arriba en
       executar. Es diu aqui mateix, on hi aniria. */
    if (c.parametre) {
      var avis = document.createElement('div');
      avis.className = 'sense-valor parametritzat';
      avis.innerHTML = 'el valor el demanara en executar-se, amb el nom <b>:' + c.parametre + '</b>';
      caixes.appendChild(avis);
      return;
    }

    var n = Motor.operador(c.operador).valors;
    var quants = n === 0 ? 0 : n === 'n' ? Math.max(2, c.valors.length + 1) : n;
    for (var k = 0; k < quants; k++) {
      (function (k) {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.value = c.valors[k] == null ? '' : c.valors[k];
        inp.placeholder = n === 'n' ? 'un valor per línia' : 'valor';
        inp.addEventListener('input', function () {
          c.valors[k] = inp.value;
          if (n === 'n') {
            c.valors = c.valors.filter(function (v, idx) { return v !== '' || idx < 2; });
            if (k === quants - 1 && inp.value !== '') {
              pintaCriteris();
              var altre = $('caixes-valor').querySelectorAll('input')[k];
              if (altre) { altre.focus(); altre.setSelectionRange(altre.value.length, altre.value.length); }
              return;
            }
          }
          pintaPanellCamps(); pintaSql();
        });
        caixes.appendChild(inp);
      })(k);
    }
    if (!quants) {
      var buit = document.createElement('div');
      buit.className = 'sense-valor';
      buit.textContent = 'aquest operador no necessita cap valor';
      caixes.appendChild(buit);
    }
  }

  /* El panell Camps: la consulta escrita, amb els connectors i els parentesis */
  function pintaPanellCamps() {
    var p = $('panell-camps');
    p.innerHTML = '';
    var criteris = consulta.criteris;
    if (!criteris.length) {
      p.innerHTML = '<p class="buit">Cap criteri. Premeu <b>Nou</b> per afegir-ne un.</p>';
      return;
    }

    var i = 0;
    while (i < criteris.length) {
      var g = criteris[i].grup;
      if (i > 0) p.appendChild(connector(criteris[i], 0));
      if (g == null) {
        p.appendChild(liniaCriteri(criteris[i], i, 0));
        i++;
      } else {
        var caixa = document.createElement('div');
        caixa.className = 'grup-criteris';
        var obre = document.createElement('span');
        obre.className = 'par'; obre.textContent = '(';
        caixa.appendChild(obre);
        var primer = true;
        while (i < criteris.length && criteris[i].grup === g) {
          if (!primer) caixa.appendChild(connector(criteris[i], 1));
          caixa.appendChild(liniaCriteri(criteris[i], i, 1));
          primer = false; i++;
        }
        var tanca = document.createElement('span');
        tanca.className = 'par'; tanca.textContent = ')';
        caixa.appendChild(tanca);
        p.appendChild(caixa);
      }
    }
  }

  function connector(c, dins) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'conn' + (dins ? ' dins' : '');
    b.textContent = c.connector === 'or' ? 'or' : 'and';
    b.title = 'Feu-hi clic per canviar entre and i or';
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      c.connector = c.connector === 'or' ? 'and' : 'or';
      pintaCriteris();
    });
    return b;
  }

  function liniaCriteri(c, i, dins) {
    var l = document.createElement('div');
    l.className = 'linia-criteri' + (i === criteriTriat ? ' triada' : '') +
                  (triatsPerCombinar.indexOf(i) !== -1 ? ' marcada' : '') +
                  (dins ? ' dins' : '');
    l.textContent = textDelCriteri(c);
    l.title = 'Clic per modificar-lo. Amb Ctrl, per combinar-lo amb un altre.';
    l.addEventListener('click', function (ev) {
      if (ev.ctrlKey || ev.metaKey) {
        var k = triatsPerCombinar.indexOf(i);
        if (k === -1) triatsPerCombinar.push(i); else triatsPerCombinar.splice(k, 1);
      } else {
        triatsPerCombinar = [];
      }
      criteriTriat = i;
      pintaCriteris();
    });
    return l;
  }

  function textDelCriteri(c) {
    var p = parts(c.camp);
    var def = Motor.camp(p.taula, p.camp) || { tipus: 'Char' };
    var op = Motor.operador(c.operador);
    var etiqueta = p.taula + '.' + p.camp;
    var t;
    if (op.valors === 0) t = etiqueta + ' ' + op.etiqueta;
    else if (c.parametre) t = etiqueta + ' ' + op.etiqueta + ' :' + c.parametre;
    else {
      var v = (c.valors || []).map(function (x) {
        if (def.tipus === 'Date') return "{d '" + x + "'}";
        if (def.tipus === 'Integer' || def.tipus === 'Pack') return String(x);
        return "'" + x + "'";
      });
      if (c.operador === 'llista' || c.operador === 'no-en-la-llista') {
        t = etiqueta + ' ' + (c.operador === 'llista' ? 'IN' : 'NOT IN') + '(' + v.join(',') + ')';
      } else if (c.operador === 'entre' || c.operador === 'no-entre') {
        t = etiqueta + ' ' + op.etiqueta + ' ' + v[0] + ' AND ' + v[1];
      } else {
        t = etiqueta + ' ' + op.etiqueta + ' ' + v.join(' ');
      }
    }
    return c.negat ? 'NOT (' + t + ')' : t;
  }

  function actualitzaBotonsCriteris() {
    $('criteris-combina').disabled = triatsPerCombinar.length < 2;
    $('criteris-descombina').disabled = !consulta.criteris.some(function (c) { return c.grup != null; });
    $('criteris-not').disabled = criteriTriat == null;
    $('criteris-suprimeix').disabled = criteriTriat == null;
    $('criteris-not').classList.toggle('premut',
      criteriTriat != null && !!consulta.criteris[criteriTriat].negat);
  }



  /* --- Propietats de la consulta --------------------------------------------- */

  /* Al programa aquest boto obre el panell de la dreta, i les quatre
     propietats hi surten sempre, encara que nomes se n'acostumi a tocar una.
     Aqui es fa igual: la propietat no es un interruptor amagat. */
  function obrePropietats() {
    $('prop-unics').value = consulta.registresUnics ? 'si' : 'no';
    $('prop-primers').value = consulta.primersRegistres;
    $('prop-percentatge').value = consulta.percentatge ? 'si' : 'no';
    $('prop-linies').value = consulta.liniesArea;
    notaPropietats();
    pintaPropietatsCamp();
    $('vel-propietats').hidden = false;
  }

  function tancaPropietats() {
    consulta.registresUnics = $('prop-unics').value === 'si';
    consulta.primersRegistres = $('prop-primers').value.trim() || '*';
    consulta.percentatge = $('prop-percentatge').value === 'si';
    consulta.liniesArea = $('prop-linies').value.trim();
    $('vel-propietats').hidden = true;
    pintaPeu(); pintaSql();
  }

  /* Les propietats del camp que hi ha seleccionat a la graella. Al programa
     surten al mateix panell de la dreta, i el titol es l'unica manera de
     saber si esteu mirant les de la consulta o les del camp. */
  function pintaPropietatsCamp() {
    var zona = $('propietats-camp');
    zona.innerHTML = '';

    var campTriat = campActual();          // val tambe el darrer camp marcat
    if (!campTriat) {
      zona.innerHTML = '<p class="nota">Cap camp seleccionat. Marqueu un camp amb la columna ' +
                       'de les ulleres, o feu clic a la seva fila, i torneu a obrir les propietats.</p>';
      return;
    }

    var p = parts(campTriat);
    var def = Motor.camp(p.taula, p.camp) || {};
    var triat = campSeleccionat(campTriat);

    var t = document.createElement('table');
    t.className = 'propietats';
    function fila(nom, control) {
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.textContent = nom;
      var td = document.createElement('td');
      if (typeof control === 'string') td.textContent = control;
      else td.appendChild(control);
      tr.appendChild(th); tr.appendChild(td);
      t.appendChild(tr);
    }

    fila('Camp', p.camp);
    fila('Format', def.tipus + ' ' + def.longitud);
    fila('Decimals', String(def.decimals == null ? 0 : def.decimals));

    var cap = document.createElement('input');
    cap.type = 'text';
    cap.size = 14;
    cap.value = triat && triat.capcalera ? triat.capcalera : p.camp;
    cap.disabled = !triat;
    cap.addEventListener('change', function () {
      if (!triat) return;
      var v = cap.value.trim();
      triat.capcalera = (v && v !== p.camp) ? v : null;
      pintaCamps();
    });
    fila('Capçalera', cap);

    var oc = document.createElement('select');
    [['no', 'No'], ['si', 'Sí']].forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0]; op.textContent = o[1];
      if (triat && triat.ocult && o[0] === 'si') op.selected = true;
      oc.appendChild(op);
    });
    oc.disabled = !triat;
    oc.addEventListener('change', function () { alternaOcult(campTriat, oc.value === 'si'); });
    fila('Ocult', oc);

    /* El panell de debo en te tres mes. No fan res aqui, pero surten perque
       es on viuen els parametres de les unitats 16 i 17: qui les busqui, que
       les trobi al mateix lloc que al programa. */
    ['Assigna al paràmetre', 'Valor que s\'assigna', 'Longitud sortida ASCII']
      .forEach(function (nom) {
        var buit = document.createElement('span');
        buit.className = 'apagat';
        buit.textContent = '(a les unitats 16 i 17)';
        fila(nom, buit);
      });

    zona.appendChild(t);

    if (triat) {
      var mou = document.createElement('div');
      mou.className = 'mou-columna';
      [['\u25C0 Cap a l\'esquerra', -1], ['Cap a la dreta \u25B6', 1]].forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = o[0];
        b.addEventListener('click', function () { mouCamp(campTriat, o[1]); });
        mou.appendChild(b);
      });
      zona.appendChild(mou);
    }

    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.innerHTML = triat
      ? 'La <b>capçalera</b> canvia el títol de la columna al resultat, no el nom del camp. ' +
        '<b>Ocult</b> deixa el camp a la consulta sense ensenyar-lo: serveix per ordenar o ' +
        'filtrar per un camp que no voleu al llistat.'
      : 'Aquest camp no està triat a la columna de les ulleres: marqueu-lo primer i podreu ' +
        'canviar-ne la capçalera, amagar-lo o moure\'l de lloc.';
    zona.appendChild(nota);
  }

  /* Un camp ocult continua a la consulta, i per tant serveix per filtrar o
     per ordenar, pero no surt al resultat. */
  function alternaOcult(nom, amagat) {
    var c = campSeleccionat(nom);
    if (!c) return;
    c.ocult = amagat;
    pintaCamps(); pintaSql();
  }

  /* Les columnes surten en l'ordre en que s'han triat, i es poden moure. */
  function mouCamp(nom, cap) {
    var i = consulta.camps.findIndex(function (c) { return c.nom === nom; });
    if (i === -1) return;
    var j = i + cap;
    if (j < 0 || j >= consulta.camps.length) return;
    var tros = consulta.camps.splice(i, 1)[0];
    consulta.camps.splice(j, 0, tros);
    pintaCamps(); pintaSql(); pintaPropietatsCamp();
  }

  function capcaleraCamp(nom) {
    var c = campSeleccionat(nom);
    return c && c.capcalera ? c.capcalera : nomCurtDe(nom);
  }

  function nomCurtDe(nom) { var i = String(nom).indexOf('.'); return i === -1 ? nom : nom.slice(i + 1); }

  function notaPropietats() {
    $('nota-propietats').innerHTML =
      '<b>Registres únics</b> fa que cada combinació de valors surti una sola vegada: és el ' +
      'SELECT DISTINCT de l\'SQL, i serveix per obtenir un catàleg en comptes d\'un llistat. ' +
      '<b>Primers registres</b> limita el resultat; l\'asterisc vol dir tots. <b>Percentatge</b> fa ' +
      'que aquell límit s\'entengui com un tant per cent. L\'última és només visual: quantes línies ' +
      'ensenya la graella.';
  }

  function pintaPeu() {
    var t = 'Registres únics: ' + (consulta.registresUnics ? 'Sí' : 'No');
    if (consulta.primersRegistres && consulta.primersRegistres !== '*') {
      t += '   ·   Primers registres: ' + consulta.primersRegistres +
           (consulta.percentatge ? ' %' : '');
    }
    $('peu-propietats').textContent = t;
  }

  /* --- Execucio -------------------------------------------------------------- */

  function executa() {
    /* Si la consulta te parametres i encara no s'han respost, el programa no
       executa res: obre la finestra que els demana. Es el comportament de les
       unitats 16 i 17. */
    if (Motor.parametres(consulta).length && !consulta.valorsParametres) {
      demanaParametres(executa);
      return;
    }
    var r = Motor.executa(consulta);
    pintaResultat(r);
    pintaSql();
  }

  /* --- Els parametres ------------------------------------------------------
     Un criteri parametritzat no porta el valor escrit: porta el nom d'una
     pregunta. Aqui es fa la pregunta, s'executa amb la resposta i despres es
     oblida, perque la consulta ha de tornar a preguntar la vegada seguent.
     ---------------------------------------------------------------------- */

  var respostesAnteriors = {};       // per no fer escriure el mateix dues vegades

  function demanaParametres(despres) {
    var noms = Motor.parametres(consulta);
    if (!noms.length) { despres(); return; }

    var zona = $('demana-valors');
    zona.innerHTML = '';
    noms.forEach(function (nom) {
      var c = consulta.criteris.filter(function (x) { return x.parametre === nom; })[0];
      var quants = Motor.operador(c.operador).valors;
      var caixes = quants === 0 ? 0
                 : (quants === 'n' ? Math.max(2, (respostesAnteriors[nom] || []).length + 1) : quants);

      var fila = document.createElement('div');
      fila.className = 'fila-parametre';
      var et = document.createElement('label');
      et.textContent = c.textParametre || (nom + ':');
      fila.appendChild(et);
      for (var k = 0; k < caixes; k++) {
        (function (k) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.dataset.parametre = nom;
          inp.value = (respostesAnteriors[nom] || [])[k] || '';
          /* Amb l'operador Llista no se sap quants valors voldra qui respon:
             en omplir la darrera caixa, n'apareix una altra. */
          if (quants === 'n') {
            inp.addEventListener('input', function () {
              if (k !== caixes - 1 || inp.value === '') return;
              var ara = [];
              Array.prototype.forEach.call(zona.querySelectorAll('input'), function (x) {
                if (x.dataset.parametre === nom && x.value !== '') ara.push(x.value);
              });
              respostesAnteriors[nom] = ara;
              var altres = {};
              Array.prototype.forEach.call(zona.querySelectorAll('input'), function (x) {
                if (x.dataset.parametre === nom) return;
                (altres[x.dataset.parametre] = altres[x.dataset.parametre] || []).push(x.value);
              });
              Object.keys(altres).forEach(function (n) { respostesAnteriors[n] = altres[n]; });
              demanaParametres(demanaDespres);
              var caixesAra = zona.querySelectorAll('input[data-parametre="' + nom + '"]');
              var seguent = caixesAra[k + 1];
              if (seguent) seguent.focus();
            });
          }
          fila.appendChild(inp);
        })(k);
      }
      var quin = document.createElement('span');
      quin.className = 'quin-camp';
      quin.textContent = Motor.nomCurt(c.camp) + '  ' + Motor.operador(c.operador).etiqueta;
      fila.appendChild(quin);
      zona.appendChild(fila);
    });

    $('vel-demana').hidden = false;
    var primera = zona.querySelector('input');
    if (primera) primera.focus();
    demanaDespres = despres;
  }

  var demanaDespres = null;

  function acceptaParametres() {
    var valors = {};
    Array.prototype.forEach.call($('demana-valors').querySelectorAll('input'), function (inp) {
      var nom = inp.dataset.parametre;
      if (!valors[nom]) valors[nom] = [];
      if (inp.value !== '') valors[nom].push(inp.value);
    });
    Object.keys(valors).forEach(function (nom) { respostesAnteriors[nom] = valors[nom]; });
    consulta.valorsParametres = valors;
    $('vel-demana').hidden = true;
    var seguent = demanaDespres;
    demanaDespres = null;
    /* Els valors valen per a aquesta execucio i prou. */
    var r = Motor.executa(consulta);
    delete consulta.valorsParametres;
    pintaResultat(r);
    pintaSql();
    if (seguent && seguent !== executa) seguent();
  }

  /* La finestra que lliga el criteri que s'esta editant a un parametre. */
  function obreParametre() {
    var c = criteriTriat != null ? consulta.criteris[criteriTriat] : null;
    if (!c) {
      $('avis-criteris').hidden = false;
      $('avis-criteris').textContent = 'Trieu abans un criteri, o premeu Nou per crear-ne un.';
      return;
    }
    $('parametre-nom').value = c.parametre || '';
    $('parametre-text').value = c.textParametre || '';
    $('avis-parametre').hidden = true;
    $('vel-parametre').hidden = false;
    $('parametre-nom').focus();
  }

  function acceptaParametre() {
    var c = criteriTriat != null ? consulta.criteris[criteriTriat] : null;
    if (!c) { $('vel-parametre').hidden = true; return; }
    var nom = $('parametre-nom').value.trim().toUpperCase().replace(/\s+/g, '_');
    if (!nom) {
      $('avis-parametre').hidden = false;
      $('avis-parametre').textContent = 'El parametre ha de tenir un nom: es el que el programa fara servir per preguntar.';
      return;
    }
    c.parametre = nom;
    c.textParametre = $('parametre-text').value.trim() || (nom + ':');
    c.valors = [];
    $('vel-parametre').hidden = true;
    pintaCriteris(); pintaSql();
  }

  function treuParametre() {
    var c = criteriTriat != null ? consulta.criteris[criteriTriat] : null;
    if (c) { delete c.parametre; delete c.textParametre; c.valors = []; }
    $('vel-parametre').hidden = true;
    pintaCriteris(); pintaSql();
  }

  function pintaResultat(r) {
    var zona = $('zona-resultat');
    var comptador = $('comptador');
    zona.innerHTML = '';

    if (!r) {
      comptador.textContent = 'Cap consulta executada';
      zona.innerHTML = '<p class="buit">Trieu camps amb la columna de les ulleres i premeu <b>Executa</b>.</p>';
      return;
    }
    if (r.error) {
      comptador.textContent = '';
      zona.innerHTML = '<p class="buit">' + r.error + '</p>';
      return;
    }

    comptador.textContent = "S'ha(n) trobat " + r.registres + ' registre(s)';

    if (!r.files.length) {
      zona.innerHTML = '<p class="buit">Cap registre. Reviseu els criteris: un valor mal escrit o un <b>and</b> impossible deixen la consulta a zero.</p>';
      return;
    }

    var taula = document.createElement('table');
    taula.className = 'resultat';
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    /* La graella del programa numera les files a l'esquerra. */
    tr.appendChild(document.createElement('th')).className = 'num';
    r.columnes.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c.camp ? capcaleraCamp(c.camp) : c.nom;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    taula.appendChild(thead);

    var tbody = document.createElement('tbody');
    var maxLinies = parseInt(consulta.liniesArea, 10);
    if (!(maxLinies > 0)) maxLinies = 300;
    r.files.slice(0, maxLinies).forEach(function (f, i) {
      var fila = document.createElement('tr');
      var num = document.createElement('td');
      num.className = 'num';
      num.textContent = String(i + 1);
      fila.appendChild(num);
      f.forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v === null || v === '' ? '·' : v;
        fila.appendChild(td);
      });
      tbody.appendChild(fila);
    });
    taula.appendChild(tbody);
    zona.appendChild(taula);

    if (r.files.length > maxLinies) {
      var avis = document.createElement('p');
      avis.className = 'buit';
      avis.textContent = 'Se n\'ensenyen ' + maxLinies + ' de ' + r.files.length + '.';
      zona.appendChild(avis);
    }
  }

  function pintaSql() {
    var s = Motor.sql(consulta) || '-- Construïu la consulta.';
    $('sql').innerHTML = s.replace(
      /\b(SELECT|DISTINCT|FROM|WHERE|GROUP BY|ORDER BY|AND|OR|NOT|IN|BETWEEN|IS NULL|IS NOT NULL|LIKE|DESC|COUNT|MIN|MAX|SUM|AVG)\b/g,
      '<span class="kw">$1</span>');
  }

  /* --- Exercicis ---------------------------------------------------------------- */

  /* Que es vol practicar. Era una llista de catorze botons que s'enduia mitja
     columna; ara es un desplegable al costat del titol, que es on va un filtre
     del que hi ha a sota, i deixa l'espai per a la correccio, que es el que
     ensenya alguna cosa. */
  function pintaConceptes() {
    var tria = $('conceptes');
    tria.innerHTML = '';

    afegeixConcepte(tria, null, 'Barreja de tot', 'totes les unitats');
    Exercicis.CONCEPTES.forEach(function (c) {
      afegeixConcepte(tria, c.id, c.nom, c.unitats);
    });
    tria.value = conceptePreferit || '';
  }

  function afegeixConcepte(tria, id, nom, unitats) {
    var o = document.createElement('option');
    o.value = id || '';
    /* Nomes el nom: les unitats ja surten a l'etiqueta de l'exercici i aqui
       nomes servirien per no deixar llegir el nom sencer. */
    o.textContent = nom;
    o.title = 'Unitats ' + unitats;
    tria.appendChild(o);
  }

  function nouExercici(concepte) {
    posaExercici(Exercicis.generaPerConcepte(concepte));
  }

  function posaExercici(nou) {
    exercici = nou;
    $('enunciat').innerHTML = exercici.enunciat;
    $('pista').innerHTML = exercici.pista;
    $('etiquetes').innerHTML =
      '<span class="etiqueta">' + nomConcepte(exercici.concepte) + '</span>' +
      '<span class="etiqueta">unitat ' + exercici.unitat + '</span>' +
      '<span class="etiqueta nivell">nivell ' + exercici.nivell + '</span>';
    $('correccio').innerHTML = '<p style="color:var(--muted);margin:0;font-size:.9rem">' +
      'Construïu la consulta i premeu <b>Corregeix</b>.</p>';
    /* Es donen les taules de l'encarrec, pero mai els enllacos: definir-los
       forma part de l'exercici. */
    var sol = exercici.solucio.consulta;
    novaConsulta(sol.taules || sol.taula);
  }

  /* La nota que surt quan s'arriba des del tutorial. */
  function avisDeProcedencia(codi, unitat) {
    var p = document.createElement('p');
    p.className = 'nota procedencia';
    p.innerHTML = unitat
      ? 'Veniu de l\'exercici <code>' + codi + '</code> del tutorial. Aquí els exercicis ' +
        'es generen: aquest és <b>un de la unitat ' + unitat + '</b>, no el mateix. ' +
        'Amb <b>Un altre</b> en surt un de nou.'
      : 'Veniu de l\'exercici <code>' + codi + '</code> del tutorial, però el simulador ' +
        'encara no té exercicis d\'aquella unitat. Aquí en teniu un de qualsevol.';
    var cos = document.querySelector('.bloc-exercici .cos');
    if (cos) cos.appendChild(p);
  }

  function nomConcepte(id) {
    var c = Exercicis.CONCEPTES.filter(function (x) { return x.id === id; })[0];
    return c ? c.nom : id;
  }

  /* --- Correccio ------------------------------------------------------------------ */

  function corregeix() {
    var r = Diagnostic.corregeix(consulta, exercici);
    var zona = $('correccio');

    if (r.encerta) marcador.encerts++; else marcador.fallades++;
    pintaMarcador();

    var html = '<div class="veredicte ' + (r.encerta ? 'be' : 'mal') + '">' +
      '<span>' + (r.encerta ? 'Correcte' : 'Encara no hi som') + '</span>' +
      '<span class="xifres">' + r.registresMeus + ' de ' + r.registresBons + ' registres</span></div>';

    if (r.encerta) {
      html += '<p style="margin:0;font-size:.9rem">La consulta fa exactament el que demanava l\'encàrrec. ' +
              'Premeu <b>Un altre</b> per continuar: la propera serà diferent.</p>';
    } else if (!r.avisos.length) {
      html += '<p style="margin:0;font-size:.9rem">El resultat no coincideix, però la consulta sembla ben plantejada. Reviseu els valors.</p>';
    } else {
      r.avisos.forEach(function (a) {
        html += '<div class="avis ' + a.gravetat + '">' +
          '<header>' + a.titol + '<span class="unitat">unitat ' + a.unitat + '</span></header>' +
          '<div class="cos"><dl>' +
          '<div><dt>Què heu fet</dt><dd>' + a.heuFet + '</dd></div>' +
          '<div><dt>Per què està malament</dt><dd>' + a.perque + '</dd></div>' +
          '<div><dt>Com hauria de quedar</dt><dd class="solucio">' + a.aixi + '</dd></div>' +
          '</dl></div></div>';
      });
    }
    zona.innerHTML = html;
  }

  function mostraSolucio() {
    consulta = JSON.parse(JSON.stringify(exercici.solucio.consulta));
    if (!consulta.taules) consulta.taules = consulta.taula ? [consulta.taula] : [];
    if (!consulta.enllacos) consulta.enllacos = [];
    if (!consulta.ordre) consulta.ordre = [];
    if (!consulta.camps) consulta.camps = [];
    if (consulta.primersRegistres == null) consulta.primersRegistres = '*';
    if (consulta.liniesArea == null) consulta.liniesArea = '';
    pintaTot(); pintaPeu();
    if (exercici.solucio.parametres) {
      /* La solucio d'un exercici parametritzat porta uns valors de prova:
         s'executa amb aquests, que es el que li passaria a qui respongues
         aixo mateix a la finestra. */
      Object.keys(exercici.solucio.parametres).forEach(function (nom) {
        respostesAnteriors[nom] = exercici.solucio.parametres[nom];
      });
      consulta.valorsParametres = exercici.solucio.parametres;
      var r = Motor.executa(consulta);
      delete consulta.valorsParametres;
      pintaResultat(r); pintaSql();
    } else {
      executa();
    }
    $('correccio').innerHTML =
      '<div class="veredicte mal"><span>Solució carregada</span>' +
      '<span class="xifres">' + exercici.solucio.registres + ' registres</span></div>' +
      explicaSolucio() +
      '<p style="margin:.8rem 0 0;font-size:.9rem;color:var(--muted)">La consulta ja està muntada a ' +
      'l\'esquerra: obriu <b>Criteris...</b> i compareu-la amb la que havíeu fet. Després premeu ' +
      '<b>Un altre</b> i feu-ne una de nova pel vostre compte.</p>';
    marcador.fallades++;
    pintaMarcador();
  }

  /* Que fa cada tros de la solucio i per que. Ensenyar la resposta sense
     explicar-la no serveix de gaire: el que s'ha d'endur es el criteri, no
     la xifra. */
  function explicaSolucio() {
    var c = exercici.solucio.consulta;
    var taules = c.taules || [c.taula];
    var html = '<dl class="explicacio">';

    html += '<div><dt>Taula</dt><dd><code>' + taules.join('</code> + <code>') + '</code></dd></div>';

    (c.enllacos || []).forEach(function (e) {
      html += '<div><dt>Enllaç</dt><dd><code>' + e.taulaA + '.' + e.campA + '</code> amb <code>' +
              e.taulaB + '.' + e.campB + '</code>, ' +
              (e.tipus === 'totes-esq' ? 'de tipus <b>totes les de ' + e.taulaA + '</b>, per no perdre ' +
                'les files sense parella' : 'de tipus <b>només les coincidents</b>') + '</dd></div>';
    });

    html += '<div><dt>Camps</dt><dd>' + (c.camps || []).map(function (x) {
      return '<code>' + x.nom + '</code>' + (x.agregat ? ' amb <b>' + Motor.AGREGATS[x.agregat].menu +
             ' &rarr; ' + Motor.AGREGATS[x.agregat].etiqueta + '</b>' : '');
    }).join(', ') + '</dd></div>';

    (c.criteris || []).forEach(function (x, i) {
      html += '<div><dt>' + (i ? (x.connector === 'or' ? 'o bé' : 'i també') : 'Criteri') + '</dt>' +
              '<dd><code>' + textDelCriteri(x) + '</code>' +
              (x.grup != null ? ' <span class="marca-grup">dins del parèntesi</span>' : '') +
              '</dd></div>';
    });

    Motor.parametres(c).forEach(function (nom) {
      var valors = (exercici.solucio.parametres || {})[nom] || [];
      html += '<div><dt>Paràmetre</dt><dd><code>:' + nom + '</code>, que el programa demana cada ' +
              'vegada que s\'executa la consulta' +
              (valors.length ? '. Aquí s\'ha provat amb <b>' + valors.join('</b> i <b>') + '</b>' : '') +
              '. Es posa des de <b>Criteris... &rarr; Paràmetres...</b></dd></div>';
    });

    if (c.registresUnics) {
      html += '<div><dt>Propietat</dt><dd><b>Registres únics</b> a Sí, perquè es demana quins valors ' +
              'existeixen i no quantes vegades surt cadascun</dd></div>';
    }
    (c.ordre || []).forEach(function (o) {
      html += '<div><dt>Ordre</dt><dd>per <code>' + o.camp + '</code>, ' +
              (o.sentit === 'desc' ? 'de gran a petit' : 'de petit a gran') + '</dd></div>';
    });

    return html + '</dl>';
  }

  function pintaMarcador() {
    $('encerts').textContent = marcador.encerts;
    $('fallades').textContent = marcador.fallades;
  }

  /* Finestra a l'estat intern. No la fa servir la pantalla: serveix perque
     les eines de eines/ puguin comprovar que el que es veu i el que es
     corregeix son la mateixa cosa. */
  window.SIMULADOR = {
    estat: function () { return { consulta: consulta, exercici: exercici }; }
  };

  document.addEventListener('DOMContentLoaded', comenca);
})();
