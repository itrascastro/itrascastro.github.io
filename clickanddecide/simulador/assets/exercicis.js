/* ---------------------------------------------------------------------------
   Cataleg d'exercicis.

   No son exercicis fixos: son PLANTILLES. Cada plantilla genera un exercici
   diferent cada vegada, canviant els valors, i construeix alhora la seva
   propia solucio. Aixi el corrector sempre sap la resposta bona, i vosaltres
   podeu practicar el mateix concepte tantes vegades com calgui sense
   memoritzar el resultat.

   Els exercicis del tutorial que porten codi EX- son casos concrets d'aquestes
   mateixes plantilles.
   --------------------------------------------------------------------------- */

const Exercicis = (function () {
  'use strict';

  function tria(llista) { return llista[Math.floor(Math.random() * llista.length)]; }

  /* Valors que existeixen de debo a les dades. Motor.files() torna les claus
     qualificades amb el nom de la taula, i el farciment ja aplicat. */
  function valorsDe(taula, camp) {
    var clau = taula + '.' + camp;
    var vistos = new Set();
    Motor.files(taula).forEach(function (f) {
      var v = f[clau] == null ? '' : String(f[clau]).replace(/\s+$/, '');
      if (v) vistos.add(v);
    });
    return Array.from(vistos).sort();
  }

  var PLANTILLES = [

    /* --- Conceptes basics ------------------------------------------------ */
    {
      id: 'persones-per-vincle',
      concepte: 'criteris',
      unitat: '06',
      nivell: 1,
      genera: function () {
        var vincles = { F: 'personal funcionari', I: 'personal interi' };
        var codi = tria(Object.keys(vincles));
        return {
          enunciat: 'Obteniu el <b>' + vincles[codi] + '</b> de la taula de persones. Mostreu el NIF.',
          pista: 'Filtreu pel camp de <b>codi</b> de vincle, mai pel de descripcio. I recordeu que el valor s\'escriu en majuscula.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [{ camp: 'PLRC_VINCLE_CODI', operador: '=', valors: [codi] }]
          }}
        };
      }
    },

    {
      id: 'persones-actives',
      concepte: 'criteris',
      unitat: '07',
      nivell: 1,
      genera: function () {
        var quin = tria([
          { txt: 'en actiu a data d\'avui', op: '=', v: ['A'],
            pista: 'El codi de qui esta en actiu avui es la <b>A</b>.' },
          { txt: 'que hagi ocupat lloc algun dia del mes en curs', op: 'llista', v: ['A', 'M'],
            pista: 'Son dos valors del mateix camp. Amb dos criteris d\'igualtat units per and obtindrieu zero.' }
        ]);
        return {
          enunciat: 'Obteniu el personal <b>' + quin.txt + '</b>. Mostreu el NIF.',
          pista: quin.pista,
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [{ camp: 'IND_ACTIU', operador: quin.op, valors: quin.v }]
          }}
        };
      }
    },

    /* --- Llocs ------------------------------------------------------------ */
    {
      id: 'llocs-vigents',
      concepte: 'criteris',
      unitat: '08',
      nivell: 2,
      genera: function () {
        return {
          enunciat: 'Obteniu els <b>llocs vigents</b>: tots els de la taula excepte els historics i els previstos. Mostreu el codi de lloc.',
          pista: 'Els historics son la <b>H</b> i els previstos la <b>A</b> i la <b>S</b>. Es mes curt excloure\'ls que enumerar la resta.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }],
            criteris: [{ camp: 'LLOC_ESTAT_PLANT_C', operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] }]
          }}
        };
      }
    },

    {
      id: 'vacants-ocupables',
      concepte: 'criteris',
      unitat: '09',
      nivell: 2,
      genera: function () {
        var cas = tria([
          { txt: 'vacants pressupostats i <b>ocupables</b>', v: 'X',
            pista: 'Compte: hi ha dos codis de vacant pressupostada. La <b>V</b> tambe ho es, pero no es pot ocupar.' },
          { txt: 'pressupostats i <b>ocupats</b>', v: 'Z',
            pista: 'El codi que vol dir amb dotacio i amb persona a dins.' },
          { txt: 'ocupats pero <b>sense pressupost</b>', v: 'O',
            pista: 'Passa en incorporacions urgents, quan la persona entra abans que es formalitzi la dotacio.' }
        ]);
        return {
          enunciat: 'De la <b>Relacio de Llocs de Treball</b>, obteniu els llocs ' + cas.txt + '. Mostreu el codi de lloc.',
          pista: cas.pista + ' I "de la RLT" vol dir estat de plantilla <b>R</b>.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }],
            criteris: [
              { camp: 'LLOC_ESTAT_PLANT_C', operador: '=', valors: ['R'] },
              { camp: 'TIPR_TIPUS_PRESSUP', operador: '=', valors: [cas.v], connector: 'and' }
            ]
          }}
        };
      }
    },

    {
      id: 'camps-buits',
      concepte: 'camps-buits',
      unitat: '09',
      nivell: 3,
      genera: function () {
        var cas = tria([
          { camp: 'ACT_NIFPER', txt: 'estan <b>ocupats</b>', op: '<>',
            pista: 'Es un camp de text. Per trobar els que tenen contingut, compareu-lo amb un espai.' },
          { camp: 'RES_NIFPER', txt: 'tenen <b>reserva</b> per a alguna persona', op: '<>',
            pista: 'Es un camp de text. Per trobar els que tenen contingut, compareu-lo amb un espai.' },
          { camp: 'RES_NIFPER', txt: '<b>no</b> tenen cap reserva', op: '=',
            pista: 'Es un camp de text: no es nul, esta ple d\'espais. Per trobar-lo buit compareu-lo amb <b>Igual</b> a un espai: el valor que escriviu es farceix fins a la llargada del camp i nomes casa amb els que estan buits del tot.' }
        ]);
        return {
          enunciat: 'Dels llocs vigents, obteniu els que ' + cas.txt + '. Mostreu el codi de lloc.',
          pista: cas.pista,
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }],
            criteris: [
              { camp: 'LLOC_ESTAT_PLANT_C', operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] },
              { camp: cas.camp, operador: cas.op, valors: [' '], connector: 'and' }
            ]
          }}
        };
      }
    },

    /* --- AND / OR i parentesis -------------------------------------------- */
    {
      id: 'and-or-parentesi',
      concepte: 'and-or',
      unitat: '07',
      nivell: 4,
      genera: function () {
        var serveis = valorsDe('WAIV9010_PERSONA', 'UBIC_UN_ORGAN_NOM');
        var especs = valorsDe('WAIV9010_PERSONA', 'PLRC_ESPECCOSCAT_C');
        var servei = tria(serveis);
        var a = tria(especs);
        var b = tria(especs.filter(function (e) { return e !== a; }));
        return {
          enunciat: 'Obteniu el personal <b>en actiu</b> del servei territorial <b>' + servei +
                    '</b> que tingui especialitat <b>' + a + '</b> o <b>' + b + '</b>. Mostreu el NIF.',
          pista: 'Busqueu l\'<b>o</b> de la frase: el que uneix va entre parentesis. Sense el parentesi us sortiran totes les persones amb aquella especialitat, siguin del servei que siguin.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [
              { camp: 'IND_ACTIU', operador: '=', valors: ['A'] },
              { camp: 'UBIC_UN_ORGAN_NOM', operador: '=', valors: [servei], connector: 'and' },
              { camp: 'PLRC_ESPECCOSCAT_C', operador: '=', valors: [a], connector: 'and', grup: 1 },
              { camp: 'PLRC_ESPECCOSCAT_C', operador: '=', valors: [b], connector: 'or', grup: 1 }
            ]
          }}
        };
      }
    },

    /* --- Recomptes --------------------------------------------------------- */
    {
      id: 'recompte-per-grup',
      concepte: 'recomptes',
      unitat: '10',
      nivell: 3,
      genera: function () {
        var cas = tria([
          { agrupa: 'UBIC_UN_ORGAN_NOM', txt: 'servei territorial' },
          { agrupa: 'PLRC_ESPECCOSCAT_C', txt: 'especialitat' },
          { agrupa: 'PLRC_VINCLE_CODI', txt: 'tipus de vincle' }
        ]);
        return {
          enunciat: 'Quantes persones <b>en actiu</b> hi ha de cada <b>' + cas.txt + '</b>?',
          pista: 'Seleccioneu el camp d\'agrupacio i el NIF, i apliqueu l\'agregat sobre el NIF. El camp que compteu desapareix; els que queden agrupen.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: cas.agrupa }, { nom: 'PERS_NIF', agregat: 'compte' }],
            criteris: [{ camp: 'IND_ACTIU', operador: '=', valors: ['A'] }]
          }}
        };
      }
    },

    {
      id: 'files-o-persones',
      concepte: 'recomptes',
      unitat: '12',
      nivell: 4,
      genera: function () {
        var cas = tria([
          { agregat: 'distinct-compte', txt: 'Quanta <b>gent diferent</b> ha tingut alguna incidencia?',
            pista: 'Aquesta taula es de registres multiples: una persona amb tres baixes hi surt tres vegades. Us cal el comptador de valors distints.' },
          { agregat: 'compte', txt: 'Quantes <b>incidencies</b> hi ha registrades en total?',
            pista: 'Aqui si que compteu files: cada fila es una incidencia.' }
        ]);
        return {
          enunciat: cas.txt,
          pista: cas.pista,
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF', agregat: cas.agregat }],
            criteris: []
          }}
        };
      }
    },

    /* --- Registres unics ---------------------------------------------------- */
    {
      id: 'quins-codis-hi-ha',
      concepte: 'registres-unics',
      unitat: '11',
      nivell: 2,
      genera: function () {
        var cas = tria([
          { taula: 'WAIV9080_LLOC', camp: 'TIPR_TIPUS_PRESSUP', txt: 'de tipus de pressupost' },
          { taula: 'WAIV9080_LLOC', camp: 'LLOC_ESTAT_PLANT_C', txt: 'd\'estat de plantilla' },
          { taula: 'WAIV9060_INCIDENCI', camp: 'INCI_TIPUS_CODI', txt: 'de tipus d\'incidencia' }
        ]);
        return {
          enunciat: 'Quins codis <b>' + cas.txt + '</b> existeixen realment a les dades? Voleu un cataleg, cada codi una sola vegada.',
          pista: 'Seleccioneu nomes aquell camp i activeu la propietat <b>Registres unics</b> des del boto de propietats de la consulta.',
          solucio: { consulta: {
            taula: cas.taula,
            camps: [{ nom: cas.camp }],
            criteris: [],
            registresUnics: true
          }}
        };
      }
    },

    /* --- Vigencia ----------------------------------------------------------- */
    {
      id: 'incidencies-vigents',
      concepte: 'vigencia',
      unitat: '13',
      nivell: 5,
      genera: function () {
        /* Nomes mesos on les dades tenen incidencies de veritat: van del
           juny a l'octubre de 2026. */
        var mesos = [
          { n: '06', nom: 'de juny', ultim: '30' }, { n: '07', nom: 'de juliol', ultim: '31' },
          { n: '08', nom: 'd\'agost', ultim: '31' }, { n: '09', nom: 'de setembre', ultim: '30' },
          { n: '10', nom: 'd\'octubre', ultim: '31' }
        ];
        var m = tria(mesos);
        var ini = '2026-' + m.n + '-01', fi = '2026-' + m.n + '-' + m.ultim;
        return {
          enunciat: 'Obteniu les incidencies que estaven <b>vigents</b> durant el mes <b>' + m.nom +
                    ' de 2026</b>. Compten les que van tocar qualsevol dia del mes, tant si van comencar ' +
                    'abans com si acaben despres. Mostreu el NIF.',
          pista: 'La data d\'inici ha de ser anterior o igual a l\'<b>ultim</b> dia del mes, i la data de fi ' +
                 'posterior o igual al <b>primer</b>, <b>o</b> ser nul.la. Les dues condicions de la data de fi ' +
                 'van entre parentesis. El comptador del peu us dira quantes n\'hi ha.',
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [
              { camp: 'INCI_DATA_INICI', operador: '<=', valors: [fi] },
              { camp: 'INCI_DATA_FI', operador: '>=', valors: [ini], connector: 'and', grup: 1 },
              { camp: 'INCI_DATA_FI', operador: 'es-nul', valors: [], connector: 'or', grup: 1 }
            ]
          }}
        };
      }
    },

    {
      id: 'incidencies-per-tipus',
      concepte: 'vigencia',
      unitat: '13',
      nivell: 4,
      genera: function () {
        var tipus = { AB: 'absencies', IT: 'incapacitats temporals', LL: 'llicencies',
                      MJ: 'maternitats biologiques', PE: 'permisos', PT: 'paternitats',
                      RJ: 'reduccions de jornada' };
        var codis = valorsDe('WAIV9060_INCIDENCI', 'INCI_TIPUS_CODI');
        var codi = tria(codis);
        /* Cada periode ha de caure dins del que hi ha a les dades: les
           incidencies comencen del juny a l'octubre i acaben de l'agost a
           l'octubre. */
        var quin = tria([
          { camp: 'INCI_DATA_INICI', txt: 'es van <b>iniciar</b>', de: '2026-06-01', a: '2026-08-31',
            periode: 'entre l\'1 de juny i el 31 d\'agost de 2026' },
          { camp: 'INCI_DATA_FI', txt: 'van <b>finalitzar</b>', de: '2026-08-01', a: '2026-10-31',
            periode: 'entre l\'1 d\'agost i el 31 d\'octubre de 2026' }
        ]);
        return {
          enunciat: 'Obteniu les incidencies de tipus <b>' + (tipus[codi] || codi) + '</b> que ' + quin.txt +
                    ' <b>' + quin.periode + '</b>. Mostreu el NIF.',
          pista: 'Dos criteris: el tipus d\'incidencia, i la data dins del periode amb l\'operador <b>Entre</b>. ' +
                 'Compte a quina de les dues dates l\'apliqueu. El comptador del peu us dira quantes n\'hi ha.',
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [
              { camp: 'INCI_TIPUS_CODI', operador: '=', valors: [codi] },
              { camp: quin.camp, operador: 'entre', valors: [quin.de, quin.a], connector: 'and' }
            ]
          }}
        };
      }
    },

    /* --- Historic ------------------------------------------------------------ */
    {
      id: 'rotacio',
      concepte: 'historic',
      unitat: '14',
      nivell: 5,
      genera: function () {
        return {
          enunciat: 'Quants <b>ocupants diferents</b> ha tingut cada lloc al llarg de la seva historia? Mostreu el codi de lloc i el recompte.',
          pista: 'Compte: aquesta taula crea una linia per cada canvi del lloc durant una mateixa ocupacio. Si compteu files, un lloc amb un sol ocupant de fa anys us sortira com a lloc d\'alta rotacio.',
          solucio: { consulta: {
            taula: 'WAIV9030_PUNTERH',
            camps: [{ nom: 'LLOC_CODI' }, { nom: 'PERS_NIF', agregat: 'distinct-compte' }],
            criteris: []
          }}
        };
      }
    },

    {
      id: 'ocupats-en-una-data',
      concepte: 'historic',
      unitat: '14',
      nivell: 6,
      genera: function () {
        /* L'historic va del setembre de 2024 al juny de 2026: qualsevol data
           d'estudi ha de caure dins d'aquesta finestra. */
        var dates = ['2024-10-15', '2025-01-31', '2025-06-30', '2025-11-15', '2026-03-01'];
        var d = tria(dates);
        return {
          enunciat: 'Quines relacions persona-lloc estaven <b>vigents el ' + d.split('-').reverse().join('/') + '</b>? Mostreu el codi de lloc i el NIF.',
          pista: 'La data d\'inici ha de ser anterior o igual a la data d\'estudi, i la de fi posterior o igual <b>o</b> nul.la. Les dues condicions de la data de fi, entre parentesis.',
          solucio: { consulta: {
            taula: 'WAIV9030_PUNTERH',
            camps: [{ nom: 'LLOC_CODI' }, { nom: 'PERS_NIF' }],
            criteris: [
              { camp: 'DATA_INICI', operador: '<=', valors: [d] },
              { camp: 'DATA_FI', operador: '>=', valors: [d], connector: 'and', grup: 1 },
              { camp: 'DATA_FI', operador: 'es-nul', valors: [], connector: 'or', grup: 1 }
            ]
          }}
        };
      }
    },

    /* --- Consultes amb mes d'una taula -------------------------------------
       A la feina real, gairebe cap pregunta interessant es respon amb una sola
       taula. Aquestes plantilles obliguen a enllaçar-les.
       ------------------------------------------------------------------- */

    {
      id: 'persones-amb-lloc',
      concepte: 'multitaula',
      unitat: '00',
      nivell: 4,
      genera: function () {
        var cas = tria([
          { camp: 'LLOC_ESTAT_PLANT_C', txt: 'l\'estat de plantilla' },
          { camp: 'TIPR_TIPUS_PRESSUP', txt: 'el tipus de pressupost' },
          { camp: 'UBIC_CENTRE_PRES', txt: 'el centre' }
        ]);
        return {
          enunciat: 'Per a cada persona <b>en actiu</b>, obteniu el seu NIF i <b>' + cas.txt +
                    ' del lloc que ocupa</b>. Nomes les que tenen un lloc de veritat.',
          pista: 'Necessiteu les dues taules. L\'enllaç va del camp de lloc de la persona al codi de lloc de la taula de llocs. Com que nomes voleu les que tenen lloc, l\'enllaç ha de ser de <b>coincidents</b>.',
          solucio: { consulta: {
            taules: ['WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [{ taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                         taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' }, { nom: 'WAIV9080_LLOC.' + cas.camp }],
            criteris: [{ camp: 'WAIV9010_PERSONA.IND_ACTIU', operador: '=', valors: ['A'] }]
          }}
        };
      }
    },

    {
      id: 'referencies-trencades',
      concepte: 'multitaula',
      unitat: '00',
      nivell: 6,
      genera: function () {
        return {
          enunciat: 'Detecteu les <b>referencies trencades</b>: persones que tenen un codi de lloc ' +
                    'informat pero que <b>no existeix</b> a la taula de llocs. Mostreu el NIF i el codi de lloc.',
          pista: 'Amb un enllaç de coincidents aquestes persones desapareixen i no us n\'assabenteu mai. ' +
                 'Feu servir <b>totes les de la primera</b> i despres busqueu les files on el codi de lloc ' +
                 'de la segona taula ha quedat buit. I compte: no confongueu qui no te lloc assignat amb qui ' +
                 'apunta a un lloc inexistent.',
          solucio: { consulta: {
            taules: ['WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [{ taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                         taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'totes-esq' }],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' }, { nom: 'WAIV9010_PERSONA.LLOC_CODI' }],
            criteris: [
              { camp: 'WAIV9080_LLOC.LLOC_CODI', operador: 'inclou', valors: [' '] },
              { camp: 'WAIV9010_PERSONA.LLOC_CODI', operador: '<>', valors: [' '], connector: 'and' }
            ]
          }}
        };
      }
    },

    {
      id: 'incidencies-amb-persona',
      concepte: 'multitaula',
      unitat: '13',
      nivell: 5,
      genera: function () {
        var cas = tria([
          { camp: 'UBIC_UN_ORGAN_NOM', txt: 'servei territorial' },
          { camp: 'PLRC_ESPECCOSCAT_C', txt: 'especialitat' },
          { camp: 'PLRC_VINCLE_CODI', txt: 'tipus de vincle' }
        ]);
        return {
          enunciat: 'Quantes <b>incidencies</b> hi ha per cada <b>' + cas.txt + '</b> de la persona? ' +
                    'La taula d\'incidencies no porta aquesta dada: l\'heu d\'anar a buscar.',
          pista: 'Enllaceu les incidencies amb les persones pel NIF. Agrupeu pel camp de la persona i ' +
                 'compteu les incidencies. Compte amb quin comptador feu servir: aqui voleu <b>files</b>, ' +
                 'perque cada fila es una incidencia.',
          solucio: { consulta: {
            taules: ['WAIV9060_INCIDENCI', 'WAIV9010_PERSONA'],
            enllacos: [{ taulaA: 'WAIV9060_INCIDENCI', campA: 'PERS_NIF',
                         taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' }],
            camps: [{ nom: 'WAIV9010_PERSONA.' + cas.camp },
                    { nom: 'WAIV9060_INCIDENCI.PERS_NIF', agregat: 'compte' }],
            criteris: []
          }}
        };
      }
    },

    {
      id: 'gent-de-baixa-per-ambit',
      concepte: 'multitaula',
      unitat: '13',
      nivell: 6,
      genera: function () {
        var serveis = valorsDe('WAIV9010_PERSONA', 'UBIC_UN_ORGAN_NOM');
        var servei = tria(serveis);
        return {
          enunciat: 'Quanta <b>gent diferent</b> del servei territorial <b>' + servei +
                    '</b> ha tingut alguna incidencia? No quantes incidencies: quanta gent.',
          pista: 'Dues coses alhora: cal enllaçar per saber el servei de cada persona, i cal el comptador ' +
                 'de valors distints perque una persona pot tenir-ne mes d\'una.',
          solucio: { consulta: {
            taules: ['WAIV9060_INCIDENCI', 'WAIV9010_PERSONA'],
            enllacos: [{ taulaA: 'WAIV9060_INCIDENCI', campA: 'PERS_NIF',
                         taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' }],
            camps: [{ nom: 'WAIV9060_INCIDENCI.PERS_NIF', agregat: 'distinct-compte' }],
            criteris: [{ camp: 'WAIV9010_PERSONA.UBIC_UN_ORGAN_NOM', operador: '=', valors: [servei] }]
          }}
        };
      }
    },

    {
      id: 'llocs-amb-ocupant',
      concepte: 'multitaula',
      unitat: '08',
      nivell: 5,
      genera: function () {
        return {
          enunciat: 'Dels llocs <b>vigents i ocupats</b>, obteniu el codi de lloc i el ' +
                    '<b>servei territorial de la persona</b> que l\'ocupa.',
          pista: 'L\'enllaç va del NIF de l\'ocupant del lloc al NIF de la taula de persones. ' +
                 'Recordeu tambe el filtre d\'estat de plantilla.',
          solucio: { consulta: {
            taules: ['WAIV9080_LLOC', 'WAIV9010_PERSONA'],
            enllacos: [{ taulaA: 'WAIV9080_LLOC', campA: 'ACT_NIFPER',
                         taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' }],
            camps: [{ nom: 'WAIV9080_LLOC.LLOC_CODI' },
                    { nom: 'WAIV9010_PERSONA.UBIC_UN_ORGAN_NOM' }],
            criteris: [{ camp: 'WAIV9080_LLOC.LLOC_ESTAT_PLANT_C',
                         operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] }]
          }}
        };
      }
    },

    /* --- Operadors de text i negacions ---------------------------------------
       El desplegable en te vint, i la meitat son la negacio de l'altra meitat.
       Aqui es practiquen els que no surten mai als exemples i acaben sent els
       que resolen les consultes de debo.
       ---------------------------------------------------------------------- */

    {
      id: 'comenca-per',
      concepte: 'operadors',
      unitat: '06',
      nivell: 2,
      genera: function () {
        var lletra = tria(['M', 'J', 'A', 'C', 'S', 'P']);
        return {
          enunciat: 'Obteniu les persones el nom de les quals <b>comença per ' + lletra +
                    '</b>. Mostreu el NIF i el nom.',
          pista: 'Hi ha un operador que fa exactament aixo i no cal escriure cap comodi. ' +
                 'Amb <b>Igual</b> haurieu d\'encertar el nom sencer, lletra per lletra.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'PERS_COGNOMS_NOM' }],
            criteris: [{ camp: 'PERS_COGNOMS_NOM', operador: 'comenca-per', valors: [lletra] }]
          }}
        };
      }
    },

    {
      id: 'acaba-per-farcit',
      concepte: 'operadors',
      unitat: '18',
      nivell: 5,
      genera: function () {
        var cognom = tria(['Roca', 'Soler', 'Pons', 'Vidal', 'Sala', 'Costa']);
        return {
          enunciat: 'Obteniu les persones que porten <b>' + cognom + '</b> entre els cognoms. ' +
                    'Mostreu el NIF i el nom.',
          pista: 'Si ho proveu amb <b>Acaba per</b> obtindreu zero, i val la pena veure-ho: el camp del ' +
                 'nom és de text i està farcit amb espais fins als 30 caràcters, de manera que cap valor ' +
                 'acaba de veritat amb una lletra. Per aixo mateix no es pot demanar l\'últim cognom, i ' +
                 'aqui es busca el cognom a qualsevol posicio amb l\'operador que mira a dins.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'PERS_COGNOMS_NOM' }],
            criteris: [{ camp: 'PERS_COGNOMS_NOM', operador: 'inclou', valors: [cognom] }]
          }}
        };
      }
    },

    {
      id: 'com-amb-comodins',
      concepte: 'operadors',
      unitat: '06',
      nivell: 4,
      genera: function () {
        var cas = tria([
          { tros: 'Vallès', txt: 'un servei territorial que contingui <b>Vallès</b>' },
          { tros: 'Llobregat', txt: 'un servei territorial que contingui <b>Llobregat</b>' },
          { tros: 'Barcelona', txt: 'un servei territorial que contingui <b>Barcelona</b>' }
        ]);
        return {
          enunciat: 'Obteniu les persones en actiu amb ' + cas.txt + '. Mostreu el NIF.',
          pista: 'Amb <b>Com</b> podeu escriure un patró: el <b>%</b> val per qualsevol tros de text. ' +
                 'Recordeu el farciment: el patró ha d\'acabar en % perquè darrere hi ha espais.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [
              { camp: 'IND_ACTIU', operador: '=', valors: ['A'] },
              { camp: 'UBIC_UN_ORGAN_NOM', operador: 'com', valors: ['%' + cas.tros + '%'], connector: 'and' }
            ]
          }}
        };
      }
    },

    {
      id: 'negacions',
      concepte: 'operadors',
      unitat: '06',
      nivell: 3,
      genera: function () {
        var cas = tria([
          { camp: 'PERS_COGNOMS_NOM', op: 'no-inclou', v: 'Pons',
            txt: 'les persones que <b>no</b> tenen <b>Pons</b> al nom', taula: 'WAIV9010_PERSONA',
            camps: ['PERS_NIF', 'PERS_COGNOMS_NOM'],
            pista: 'Cada operador té la seva negació just a sota al desplegable. No cal fer la consulta al revés i restar.' },
          { camp: 'PERS_NIF', op: 'no-comenca-per', v: 'SIM00001',
            txt: 'les persones amb un NIF que <b>no comença per SIM00001</b>', taula: 'WAIV9010_PERSONA',
            camps: ['PERS_NIF'],
            pista: 'Cada operador té la seva negació just a sota al desplegable.' },
          { camp: 'PLRC_ESPECCOSCAT_D', op: 'no-inclou', v: 'Llengua',
            txt: 'les persones d\'una especialitat que <b>no</b> parla de <b>Llengua</b>', taula: 'WAIV9010_PERSONA',
            camps: ['PERS_NIF', 'PLRC_ESPECCOSCAT_D'],
            pista: 'Aquí sí que va bé el camp de descripció: busqueu un tros de text, no un codi.' }
        ]);
        return {
          enunciat: 'Obteniu ' + cas.txt + '.',
          pista: cas.pista,
          solucio: { consulta: {
            taula: cas.taula,
            camps: cas.camps.map(function (n) { return { nom: n }; }),
            criteris: [{ camp: cas.camp, operador: cas.op, valors: [cas.v] }]
          }}
        };
      }
    },

    {
      id: 'ja-tancades',
      concepte: 'operadors',
      unitat: '13',
      nivell: 3,
      genera: function () {
        var cas = tria([
          { op: 'no-es-nul', txt: 'ja tenen <b>data de fi</b>, és a dir que estan tancades' },
          { op: 'es-nul', txt: '<b>no</b> tenen data de fi: continuen obertes' }
        ]);
        return {
          enunciat: 'Obteniu les incidències que ' + cas.txt + '. Mostreu el NIF.',
          pista: 'La data de fi és de tipus <b>Date</b>, i les dates són l\'únic tipus que pot ser nul de ' +
                 'debò. Aquí sí que funcionen <b>És nul</b> i <b>No és nul</b>, al contrari del que passa ' +
                 'amb els camps de text.',
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF' }],
            criteris: [{ camp: 'INCI_DATA_FI', operador: cas.op, valors: [] }]
          }}
        };
      }
    },

    {
      id: 'fora-del-periode',
      concepte: 'operadors',
      unitat: '13',
      nivell: 4,
      genera: function () {
        var cas = tria([
          { de: '2026-07-01', a: '2026-08-31', txt: 'juliol i agost' },
          { de: '2026-06-01', a: '2026-07-31', txt: 'juny i juliol' },
          { de: '2026-09-01', a: '2026-10-31', txt: 'setembre i octubre' }
        ]);
        return {
          enunciat: 'Obteniu les incidències que <b>no</b> van començar durant <b>' + cas.txt +
                    ' de 2026</b>. Mostreu el NIF i la data d\'inici.',
          pista: 'Amb dos criteris de desigualtat units per <b>or</b> també surt, però hi ha un ' +
                 'operador que ho diu d\'una sola vegada: és la negació d\'<b>Entre</b>.',
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'INCI_DATA_INICI' }],
            criteris: [{ camp: 'INCI_DATA_INICI', operador: 'no-entre', valors: [cas.de, cas.a] }]
          }}
        };
      }
    },

    /* --- Camps numerics ------------------------------------------------------
       La jornada del lloc es un camp Integer. Amb ell es practiquen les
       comparacions numeriques i els agregats que fins ara no tenien on
       aplicar-se, i tambe el germa numeric del parany del farciment: un camp
       numeric buit no es nul, es un zero.
       ---------------------------------------------------------------------- */

    {
      id: 'jornada-parcial',
      concepte: 'numerics',
      unitat: '09',
      nivell: 3,
      genera: function () {
        var cas = tria([
          { op: '<', v: '100', txt: 'a <b>temps parcial</b>, és a dir amb una jornada inferior al <b>100 %</b>' },
          { op: '>', v: '50', txt: 'amb una jornada <b>superior al 50 %</b>' },
          { op: '=', v: '100', txt: 'a <b>jornada sencera</b>, és a dir al <b>100 %</b>' }
        ]);
        return {
          enunciat: 'Dels llocs vigents, obteniu els que treballen ' + cas.txt + '. Mostreu el codi i la jornada.',
          pista: 'La jornada és un camp <b>Integer</b>: es compara amb un nombre, sense cometes ni ' +
                 'farciment. Compte de no deixar-vos el filtre d\'estat de plantilla.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }, { nom: 'LLOC_QUANTA_HORARI' }],
            criteris: [
              { camp: 'LLOC_ESTAT_PLANT_C', operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] },
              { camp: 'LLOC_QUANTA_HORARI', operador: cas.op, valors: [cas.v], connector: 'and' }
            ]
          }}
        };
      }
    },

    {
      id: 'jornada-zero',
      concepte: 'numerics',
      unitat: '09',
      nivell: 5,
      genera: function () {
        return {
          enunciat: 'Obteniu els llocs que <b>encara no tenen jornada assignada</b>. Mostreu el codi ' +
                    'de lloc i l\'estat de plantilla.',
          pista: 'Aquí no serveix <b>És nul</b>. Els camps numèrics tampoc són mai nuls: quan no hi ha ' +
                 'valor hi consta un <b>zero</b>. És el mateix parany que amb els camps de text, però ' +
                 'amb una altra cara.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }, { nom: 'LLOC_ESTAT_PLANT_C' }],
            criteris: [{ camp: 'LLOC_QUANTA_HORARI', operador: '=', valors: ['0'] }]
          }}
        };
      }
    },

    {
      id: 'agregats-numerics',
      concepte: 'numerics',
      unitat: '10',
      nivell: 5,
      genera: function () {
        var cas = tria([
          { agr: 'suma', txt: 'la <b>suma</b> de jornades, que és la plantilla equivalent a jornada sencera' },
          { agr: 'mitjana', txt: 'la <b>jornada mitjana</b>' },
          { agr: 'minim', txt: 'la <b>jornada més baixa</b>' },
          { agr: 'maxim', txt: 'la <b>jornada més alta</b>' }
        ]);
        var per = tria([
          { camp: 'UBIC_UN_ORGAN_NOM', txt: 'servei territorial' },
          { camp: 'PLRC_ESPECCOSCAT_C', txt: 'especialitat' }
        ]);
        return {
          enunciat: 'Dels llocs vigents i <b>per ' + per.txt + '</b>, obteniu ' + cas.txt + '.',
          pista: 'Un camp agrupa i l\'altre porta l\'agregat: clic dret sobre el camp de la jornada &rarr; ' +
                 '<b>Agregats</b>. Si hi poseu un tercer camp de detall, l\'agrupació es trenca.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: per.camp }, { nom: 'LLOC_QUANTA_HORARI', agregat: cas.agr }],
            criteris: [{ camp: 'LLOC_ESTAT_PLANT_C', operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] }]
          }}
        };
      }
    },

    {
      id: 'dates-extremes',
      concepte: 'numerics',
      unitat: '14',
      nivell: 5,
      genera: function () {
        var cas = tria([
          { agr: 'minim', camp: 'DATA_INICI', txt: 'la data d\'inici <b>més antiga</b>' },
          { agr: 'maxim', camp: 'DATA_INICI', txt: 'la data d\'inici <b>més recent</b>' }
        ]);
        return {
          enunciat: 'A l\'històric, obteniu ' + cas.txt + ' <b>de cada lloc</b>. Mostreu el codi de lloc i la data.',
          pista: 'Els agregats de mínim i màxim no són només per a nombres: sobre una data donen la ' +
                 'primera i l\'última. Agrupeu pel codi de lloc.',
          solucio: { consulta: {
            taula: 'WAIV9030_PUNTERH',
            camps: [{ nom: 'LLOC_CODI' }, { nom: cas.camp, agregat: cas.agr }],
            criteris: []
          }}
        };
      }
    },

    {
      id: 'acaba-per-complet',
      concepte: 'operadors',
      unitat: '18',
      nivell: 5,
      genera: function () {
        var xifra = tria(['1', '2', '3', '4', '5', '7', '9']);
        var cas = tria([
          { op: 'acaba-per', txt: 'acaba en <b>' + xifra + '</b>' },
          { op: 'no-acaba-per', txt: '<b>no</b> acaba en <b>' + xifra + '</b>' }
        ]);
        return {
          enunciat: 'Obteniu els llocs el codi dels quals ' + cas.txt + '. Mostreu el codi de lloc.',
          pista: 'Aquí <b>Acaba per</b> sí que funciona, i val la pena entendre per què: el codi de ' +
                 'lloc ocupa els vuit caràcters del camp, de manera que no hi queda cap espai de ' +
                 'farciment al darrere. Al NIF, que en fa nou dins d\'un camp de deu, el mateix ' +
                 'operador no trobaria res.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }],
            criteris: [{ camp: 'LLOC_CODI', operador: cas.op, valors: [xifra] }]
          }}
        };
      }
    },

    {
      id: 'no-es-com',
      concepte: 'operadors',
      unitat: '06',
      nivell: 4,
      genera: function () {
        var tros = tria(['Vallès', 'Llobregat', 'Central']);
        return {
          enunciat: 'Obteniu les persones en actiu que <b>no</b> són d\'un servei territorial que ' +
                    'contingui <b>' + tros + '</b>. Mostreu el NIF i el servei.',
          pista: 'És el patró de <b>Com</b> amb la negació. Recordeu els dos <b>%</b>: sense el del ' +
                 'final, el farciment amb espais ja fa que el patró no encaixi amb res.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'UBIC_UN_ORGAN_NOM' }],
            criteris: [
              { camp: 'IND_ACTIU', operador: '=', valors: ['A'] },
              { camp: 'UBIC_UN_ORGAN_NOM', operador: 'no-es-com', valors: ['%' + tros + '%'], connector: 'and' }
            ]
          }}
        };
      }
    },

    /* --- Ordenacio -----------------------------------------------------------
       La columna del mig de les tres, la de les ratlletes. Un llistat sense
       ordenar surt en l'ordre en que la taula el guarda, que no vol dir res.
       ---------------------------------------------------------------------- */

    {
      id: 'ordena-simple',
      concepte: 'ordenacio',
      unitat: '05',
      nivell: 2,
      genera: function () {
        var cas = tria([
          { camp: 'PERS_COGNOMS_NOM', sentit: 'asc', txt: 'per <b>nom</b>, de la A a la Z' },
          { camp: 'PERS_COGNOMS_NOM', sentit: 'desc', txt: 'per <b>nom</b>, de la Z a la A' },
          { camp: 'PERS_NIF', sentit: 'desc', txt: 'per <b>NIF</b>, de gran a petit' }
        ]);
        return {
          enunciat: 'Obteniu el personal en actiu ordenat ' + cas.txt + '. Mostreu el NIF i el nom.',
          pista: 'L\'ordenació es marca a la <b>segona</b> columna de les tres, la de les ratlletes. ' +
                 'Un clic ordena de menor a major i un segon clic capgira el sentit.',
          solucio: { consulta: {
            taula: 'WAIV9010_PERSONA',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'PERS_COGNOMS_NOM' }],
            criteris: [{ camp: 'IND_ACTIU', operador: '=', valors: ['A'] }],
            ordre: [{ camp: cas.camp, sentit: cas.sentit }]
          }}
        };
      }
    },

    {
      id: 'ordena-agrupat',
      concepte: 'ordenacio',
      unitat: '05',
      nivell: 4,
      genera: function () {
        var cas = tria([
          { camp: 'LLOC_QUANTA_HORARI', sentit: 'desc', txt: 'de més jornada a menys' },
          { camp: 'LLOC_QUANTA_HORARI', sentit: 'asc', txt: 'de menys jornada a més' }
        ]);
        return {
          enunciat: 'Dels llocs vigents i <b>ocupats</b>, obteniu el codi i la jornada, ordenats ' +
                    cas.txt + '.',
          pista: 'Dos criteris i una ordenació. Recordeu que "ocupat" es mira pel camp de l\'ocupant, ' +
                 'que és de text: compareu-lo amb un espai.',
          solucio: { consulta: {
            taula: 'WAIV9080_LLOC',
            camps: [{ nom: 'LLOC_CODI' }, { nom: 'LLOC_QUANTA_HORARI' }],
            criteris: [
              { camp: 'LLOC_ESTAT_PLANT_C', operador: 'no-en-la-llista', valors: ['A', 'H', 'S'] },
              { camp: 'ACT_NIFPER', operador: '<>', valors: [' '], connector: 'and' }
            ],
            ordre: [{ camp: cas.camp, sentit: cas.sentit }]
          }}
        };
      }
    },

    /* --- Titulacions: la taula de registres multiples del video 12 ---------
       Cada persona hi surt tantes vegades com titulacions te. Es la taula
       que ensenya de debo que comptar files no es comptar gent.
       ---------------------------------------------------------------------- */

    {
      id: 'titulacions-per-nivell',
      concepte: 'titulacions',
      unitat: '12',
      nivell: 2,
      genera: function () {
        var nivells = { A1: 'llicenciatures, graus i doctorats', A2: 'enginyeries tecniques i diplomatures',
                        C1: 'batxillerat i cicles de grau superior', ID: 'idiomes i competencies digitals' };
        var n = tria(Object.keys(nivells));
        return {
          enunciat: 'Obteniu les titulacions de <b>nivell ' + n + '</b> (' + nivells[n] + '). ' +
                    'Mostreu el NIF i la descripcio de la titulacio.',
          pista: 'Un sol criteri sobre el camp del nivell. Compte: aqui una persona pot sortir mes ' +
                 'd\'una vegada, perque la taula te una fila per titulacio, no per persona.',
          solucio: { consulta: {
            taula: 'WAIV9040_TITULACIO',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'TITL_DESC_TITULACI' }],
            criteris: [{ camp: 'TITL_NIVELL', operador: '=', valors: [n] }]
          }}
        };
      }
    },

    {
      id: 'titulacions-per-persona',
      concepte: 'titulacions',
      unitat: '12',
      nivell: 4,
      genera: function () {
        var n = tria(['A1', 'A2']);
        return {
          enunciat: 'Quantes titulacions de <b>nivell ' + n + '</b> te cada persona? Mostreu el NIF ' +
                    'i el recompte.',
          pista: 'Agrupeu pel NIF i compteu el codi de titulacio. Gairebe tothom en tindra una, pero ' +
                 'n\'hi ha que en tenen dues del mateix nivell, i aquestes son les que fan que comptar ' +
                 'files no sigui comptar gent.',
          solucio: { consulta: {
            taula: 'WAIV9040_TITULACIO',
            camps: [{ nom: 'PERS_NIF' }, { nom: 'TITL_CODI_TITULACI', agregat: 'compte' }],
            criteris: [{ camp: 'TITL_NIVELL', operador: '=', valors: [n] }]
          }}
        };
      }
    },

    {
      id: 'gent-per-titulacio',
      concepte: 'titulacions',
      unitat: '12',
      nivell: 4,
      genera: function () {
        var n = tria(['A1', 'A2', 'C1']);
        return {
          enunciat: 'Quanta gent te cada titulacio de <b>nivell ' + n + '</b>? Mostreu el codi, la ' +
                    'descripcio i el recompte.',
          pista: 'Ara s\'agrupa per la titulacio i es compta el NIF. Es la consulta contraria a l\'altra: ' +
                 'la mateixa taula respon les dues preguntes segons per quin camp agrupeu.',
          solucio: { consulta: {
            taula: 'WAIV9040_TITULACIO',
            camps: [{ nom: 'TITL_CODI_TITULACI' }, { nom: 'TITL_DESC_TITULACI' },
                    { nom: 'PERS_NIF', agregat: 'compte' }],
            criteris: [{ camp: 'TITL_NIVELL', operador: '=', valors: [n] }]
          }}
        };
      }
    },

    {
      id: 'titulacions-amb-persona',
      concepte: 'multitaula',
      unitat: '12',
      nivell: 5,
      genera: function () {
        var n = tria(['A1', 'A2']);
        return {
          enunciat: 'De qui te alguna titulacio de <b>nivell ' + n + '</b>, obteniu el NIF i el seu ' +
                    '<b>vincle</b>. El vincle no es a la taula de titulacions.',
          pista: 'Enllaceu les titulacions amb les persones pel NIF. Nomes voleu qui te titulacio, ' +
                 'de manera que l\'enllac ha de ser de coincidents.',
          solucio: { consulta: {
            taules: ['WAIV9040_TITULACIO', 'WAIV9010_PERSONA'],
            enllacos: [{ taulaA: 'WAIV9040_TITULACIO', campA: 'PERS_NIF',
                         taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' }],
            camps: [{ nom: 'WAIV9040_TITULACIO.PERS_NIF' },
                    { nom: 'WAIV9010_PERSONA.PLRC_VINCLE_DESC' }],
            criteris: [{ camp: 'WAIV9040_TITULACIO.TITL_NIVELL', operador: '=', valors: [n] }]
          }}
        };
      }
    },

    {
      id: 'incidencies-universos',
      concepte: 'vigencia',
      unitat: '13',
      nivell: 5,
      genera: function () {
        var cas = tria([
          { taula: 'WAIV9061_INCPERDEP',
            txt: 'de la gent que <b>ara mateix</b> ocupa un lloc del vostre ambit, ' +
                 's\'hagi iniciat on s\'hagi iniciat la incidencia',
            pista: 'Aquest es l\'univers de la taula <b>9061</b>: les incidencies de qui ara es al ' +
                   'vostre ambit. La 9060 recull les que es van INICIAR al vostre ambit, que no es el ' +
                   'mateix conjunt.' },
          { taula: 'WAIV9060_INCIDENCI',
            txt: 'que es van <b>iniciar</b> en llocs del vostre ambit, hi sigui ara qui hi sigui',
            pista: 'Aquest es l\'univers de la taula <b>9060</b>. La 9061 recull les de qui ara ocupa ' +
                   'un lloc del vostre ambit, que no es el mateix conjunt.' }
        ]);
        var tipus = tria(['AB', 'IT', 'LL', 'MJ', 'PE', 'PT', 'RJ']);
        return {
          enunciat: 'Obteniu les incidencies de tipus <b>' + tipus + '</b> ' + cas.txt +
                    '. Mostreu el NIF, la data d\'inici i la data de fi.',
          pista: cas.pista + ' Les dues taules tenen exactament els mateixos camps: l\'unica cosa que ' +
                 'canvia es quines files hi ha.',
          solucio: { consulta: {
            taula: cas.taula,
            camps: [{ nom: 'PERS_NIF' }, { nom: 'INCI_DATA_INICI' }, { nom: 'INCI_DATA_FI' }],
            criteris: [{ camp: 'INCI_TIPUS_CODI', operador: '=', valors: [tipus] }]
          }}
        };
      }
    },

    {
      id: 'ubicacio-actual-o-historica',
      concepte: 'vigencia',
      unitat: '13',
      nivell: 6,
      genera: function () {
        var cas = tria([
          { camp: 'UBIA_UN_ORGAN_NOM', txt: 'on es la persona <b>ara</b>' },
          { camp: 'UBIH_UN_ORGAN_NOM', txt: 'on era <b>quan es va produir</b> la incidencia' }
        ]);
        return {
          enunciat: 'De les incidencies ja tancades, obteniu el NIF i la unitat organica que diu ' +
                    cas.txt + '.',
          pista: 'La taula porta les dues ubicacions: <b>UBIA</b> es l\'actual i <b>UBIH</b> la del ' +
                 'moment de la incidencia. Si algu ha canviat de destinacio, no son la mateixa, i ' +
                 'triar-ne una o l\'altra canvia el recompte per unitat.',
          solucio: { consulta: {
            taula: 'WAIV9060_INCIDENCI',
            camps: [{ nom: 'PERS_NIF' }, { nom: cas.camp }],
            criteris: [{ camp: 'INCI_DATA_FI', operador: 'no-es-nul', valors: [] }]
          }}
        };
      }
    },

    /* --- Tres taules ------------------------------------------------------
       El pas de dues a tres taules no es una consulta mes gran: es una altra
       manera de pensar. La segona taula s'enllaça amb la primera, i la tercera
       s'ha d'enllaçar amb alguna de les dues que ja hi son. Si algun enllaç
       falta, el programa avisa i no executa.
       ------------------------------------------------------------------ */

    {
      id: 'tres-titulacions-del-lloc',
      concepte: 'tres-taules',
      unitat: '12',
      nivell: 6,
      genera: function () {
        var cas = tria([
          { codi: 'R', txt: 'de la RLT' },
          { codi: 'H', txt: 'historics' }
        ]);
        return {
          enunciat: 'De les persones que ocupen llocs <b>' + cas.txt + '</b>, obteniu el NIF, ' +
                    'la <b>descripcio de la titulacio</b> i el <b>codi del lloc</b>.',
          pista: 'Tres taules: titulacions, persones i llocs. Les titulacions s\'enllacen amb les ' +
                 'persones pel NIF, i les persones amb els llocs pel codi de lloc. La tercera taula ' +
                 's\'ha d\'enllacar amb alguna de les dues que ja hi son, no queda penjada.',
          solucio: { consulta: {
            taules: ['WAIV9040_TITULACIO', 'WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [
              { taulaA: 'WAIV9040_TITULACIO', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' },
                    { nom: 'WAIV9040_TITULACIO.TITL_DESC_TITULACI' },
                    { nom: 'WAIV9080_LLOC.LLOC_CODI' }],
            criteris: [{ camp: 'WAIV9080_LLOC.LLOC_ESTAT_PLANT_C', operador: '=', valors: [cas.codi] }]
          }}
        };
      }
    },

    {
      id: 'tres-incidencies-per-tipus-de-lloc',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 7,
      genera: function () {
        var cas = tria([
          { camp: 'LLOC_TIPUS_DESC', txt: 'tipus de lloc' },
          { camp: 'LLOC_TIPOBASI_DESC', txt: 'tipologia basica del lloc' },
          { camp: 'LLOC_ESTAT_PLANT_D', txt: 'estat de plantilla del lloc' }
        ]);
        return {
          enunciat: 'Quantes <b>incidencies</b> hi ha per cada <b>' + cas.txt + '</b>? ' +
                    'La incidencia no sap res del lloc: ho heu d\'anar a buscar passant per la persona.',
          pista: 'Incidencies amb persones pel NIF, i persones amb llocs pel codi de lloc. ' +
                 'Despres agrupeu pel camp del lloc i compteu les incidencies. Voleu <b>files</b>, ' +
                 'perque cada fila es una incidencia.',
          solucio: { consulta: {
            taules: ['WAIV9060_INCIDENCI', 'WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [
              { taulaA: 'WAIV9060_INCIDENCI', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9080_LLOC.' + cas.camp },
                    { nom: 'WAIV9060_INCIDENCI.PERS_NIF', agregat: 'compte' }],
            criteris: []
          }}
        };
      }
    },

    {
      id: 'tres-gent-diferent-de-baixa-per-lloc',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 8,
      genera: function () {
        var tipus = tria(valorsDe('WAIV9080_LLOC', 'LLOC_TIPUS_CODI'));
        return {
          enunciat: 'Dels llocs de tipus <b>' + tipus + '</b>, quanta <b>gent diferent</b> ha tingut ' +
                    'alguna incidencia? No quantes incidencies: quanta gent.',
          pista: 'Tres taules i el comptador de valors distints. Una persona pot tenir mes d\'una ' +
                 'incidencia, i amb el compte de files la comptarieu tantes vegades com incidencies te.',
          solucio: { consulta: {
            taules: ['WAIV9060_INCIDENCI', 'WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [
              { taulaA: 'WAIV9060_INCIDENCI', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9060_INCIDENCI.PERS_NIF', agregat: 'distinct-compte' }],
            criteris: [{ camp: 'WAIV9080_LLOC.LLOC_TIPUS_CODI', operador: '=', valors: [tipus] }]
          }}
        };
      }
    },

    {
      id: 'tres-historic-amb-lloc-i-persona',
      concepte: 'tres-taules',
      unitat: '14',
      nivell: 7,
      genera: function () {
        var cas = tria([
          { camp: 'PLRC_VINCLE_CODI', txt: 'el codi de vincle de la persona' },
          { camp: 'UBIC_UN_ORGAN_NOM', txt: 'la unitat organica de la persona' },
          { camp: 'PLRC_COS_CATEGOR_D', txt: 'la categoria de la persona' }
        ]);
        return {
          enunciat: 'De l\'<b>historic de punters</b>, obteniu el NIF, la data d\'inici, ' +
                    'el <b>nom del lloc</b> i <b>' + cas.txt + '</b>. Ordeneu per data d\'inici, ' +
                    'de la mes nova a la mes antiga.',
          pista: 'L\'historic enllaça amb les persones pel NIF i amb els llocs pel codi de lloc: ' +
                 'les dues, i totes dues surten de la mateixa taula, la de l\'historic. ' +
                 'Per ordenar de nou a antic, feu dos clics a la casella de les barretes.',
          solucio: { consulta: {
            taules: ['WAIV9030_PUNTERH', 'WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [
              { taulaA: 'WAIV9030_PUNTERH', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9030_PUNTERH', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9030_PUNTERH.PERS_NIF' },
                    { nom: 'WAIV9030_PUNTERH.DATA_INICI' },
                    { nom: 'WAIV9080_LLOC.LLOC_NOM' },
                    { nom: 'WAIV9010_PERSONA.' + cas.camp }],
            criteris: [],
            ordre: [{ camp: 'WAIV9030_PUNTERH.DATA_INICI', sentit: 'desc' }]
          }}
        };
      }
    },

    {
      id: 'tres-titulats-amb-incidencia',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 8,
      genera: function () {
        var agrup = tria(valorsDe('WAIV9040_TITULACIO', 'TITL_AGRUP_C'));
        return {
          enunciat: 'De la gent amb una titulacio de l\'agrupacio <b>' + agrup + '</b>, ' +
                    'obteniu el NIF, la descripcio de la titulacio i el <b>tipus d\'incidencia</b> ' +
                    'que ha tingut.',
          pista: 'Titulacions i incidencies no es toquen: totes dues pengen de la persona. ' +
                 'Enllaceu-les pel NIF amb la taula de persones i deixeu-les enllacades a traves d\'ella.',
          solucio: { consulta: {
            taules: ['WAIV9040_TITULACIO', 'WAIV9010_PERSONA', 'WAIV9060_INCIDENCI'],
            enllacos: [
              { taulaA: 'WAIV9040_TITULACIO', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'PERS_NIF',
                taulaB: 'WAIV9060_INCIDENCI', campB: 'PERS_NIF', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' },
                    { nom: 'WAIV9040_TITULACIO.TITL_DESC_TITULACI' },
                    { nom: 'WAIV9060_INCIDENCI.INCI_TIPUS_DESC' }],
            criteris: [{ camp: 'WAIV9040_TITULACIO.TITL_AGRUP_C', operador: '=', valors: [agrup] }]
          }}
        };
      }
    },

    {
      id: 'tres-amb-filtre-a-cada-taula',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 9,
      genera: function () {
        var tipus = tria(valorsDe('WAIV9060_INCIDENCI', 'INCI_TIPUS_CODI'));
        return {
          enunciat: 'Persones <b>en actiu</b> que ocupen un lloc <b>de la RLT</b> i que han tingut ' +
                    'una incidencia de tipus <b>' + tipus + '</b>. Mostreu el NIF, el codi de lloc ' +
                    'i la data d\'inici de la incidencia.',
          pista: 'Un criteri a cada taula. Els tres van units amb <b>and</b>: cada un estreny mes ' +
                 'el resultat. Compte amb quina taula porta cada camp.',
          solucio: { consulta: {
            taules: ['WAIV9010_PERSONA', 'WAIV9080_LLOC', 'WAIV9060_INCIDENCI'],
            enllacos: [
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'PERS_NIF',
                taulaB: 'WAIV9060_INCIDENCI', campB: 'PERS_NIF', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' },
                    { nom: 'WAIV9080_LLOC.LLOC_CODI' },
                    { nom: 'WAIV9060_INCIDENCI.INCI_DATA_INICI' }],
            criteris: [
              { camp: 'WAIV9010_PERSONA.IND_ACTIU', operador: '=', valors: ['A'] },
              { camp: 'WAIV9080_LLOC.LLOC_ESTAT_PLANT_C', operador: '=', valors: ['R'], connector: 'and' },
              { camp: 'WAIV9060_INCIDENCI.INCI_TIPUS_CODI', operador: '=', valors: [tipus], connector: 'and' }
            ]
          }}
        };
      }
    },

    {
      id: 'tres-dies-de-baixa-per-unitat',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 9,
      genera: function () {
        var cas = tria([
          { agregat: 'suma',    txt: 'el total de dies de baixa' },
          { agregat: 'mitjana', txt: 'la mitjana de dies de baixa' },
          { agregat: 'maxim',   txt: 'la baixa mes llarga' }
        ]);
        return {
          enunciat: 'Per cada <b>unitat organica</b>, obteniu <b>' + cas.txt + '</b> de la gent que ' +
                    'ocupa llocs de la <b>RLT</b>.',
          pista: 'La unitat organica la porta la persona, els dies de baixa la incidencia i l\'estat ' +
                 'de plantilla el lloc: tres taules. Agrupeu per la unitat i poseu l\'agregat sobre ' +
                 'els dies.',
          solucio: { consulta: {
            taules: ['WAIV9060_INCIDENCI', 'WAIV9010_PERSONA', 'WAIV9080_LLOC'],
            enllacos: [
              { taulaA: 'WAIV9060_INCIDENCI', campA: 'PERS_NIF',
                taulaB: 'WAIV9010_PERSONA', campB: 'PERS_NIF', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }
            ],
            camps: [{ nom: 'WAIV9010_PERSONA.UBIC_UN_ORGAN_NOM' },
                    { nom: 'WAIV9060_INCIDENCI.INCI_DIES_BAIXA', agregat: cas.agregat }],
            criteris: [{ camp: 'WAIV9080_LLOC.LLOC_ESTAT_PLANT_C', operador: '=', valors: ['R'] }]
          }}
        };
      }
    },

    {
      id: 'tres-amb-totes-les-de-la-primera',
      concepte: 'tres-taules',
      unitat: '13',
      nivell: 10,
      genera: function () {
        return {
          enunciat: 'De la gent <b>en actiu que ocupa un lloc</b>, obteniu el NIF, el nom del lloc i ' +
                    'la data d\'inici de la seva incidencia, <b>tambe si no n\'ha tingut cap</b>.',
          pista: 'Les dues primeres van de coincidents, perque nomes voleu qui te lloc. La tercera ha ' +
                 'de deixar passar les files sense parella: es l\'enllac de <b>totes les de la ' +
                 'primera</b>. Amb coincidents perdrieu exactament la gent que voleu veure.',
          solucio: { consulta: {
            taules: ['WAIV9010_PERSONA', 'WAIV9080_LLOC', 'WAIV9060_INCIDENCI'],
            enllacos: [
              { taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' },
              { taulaA: 'WAIV9010_PERSONA', campA: 'PERS_NIF',
                taulaB: 'WAIV9060_INCIDENCI', campB: 'PERS_NIF', tipus: 'totes-esq' }
            ],
            camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' },
                    { nom: 'WAIV9080_LLOC.LLOC_NOM' },
                    { nom: 'WAIV9060_INCIDENCI.INCI_DATA_INICI' }],
            criteris: [{ camp: 'WAIV9010_PERSONA.IND_ACTIU', operador: '=', valors: ['A'] }]
          }}
        };
      }
    },

    /* --- Consultes parametritzades ----------------------------------------
       Unitats 16 i 17. El valor no s'escriu al criteri: el criteri diu quin
       parametre l'ha de portar, i el programa el pregunta cada vegada que
       s'executa. Una consulta en comptes de vint.
       ------------------------------------------------------------------ */

    {
      id: 'parametre-departament',
      concepte: 'parametres',
      unitat: '16',
      nivell: 4,
      genera: function () {
        var deps = valorsDe('WAIV9010_PERSONA', 'UBIC_DEPARTAM_CODI');
        var prova = tria(deps);
        return {
          enunciat: 'Feu una consulta que serveixi <b>per a qualsevol departament</b>: en executar-la ' +
                    'ha de <b>preguntar el codi de departament</b> i ensenyar el NIF i els cognoms ' +
                    'de la gent d\'aquell departament. Anomeneu el parametre <code>DEPARTAMENT</code>.',
          pista: 'Poseu el criteri sobre <code>UBIC_DEPARTAM_CODI</code> amb l\'operador <b>=</b>, i ' +
                 'en comptes d\'escriure el valor, premeu <b>Paràmetres...</b> a la finestra de ' +
                 'criteris. Codis que hi ha: ' + deps.join(', ') + '.',
          solucio: {
            parametres: { DEPARTAMENT: [prova] },
            consulta: {
              taula: 'WAIV9010_PERSONA',
              camps: [{ nom: 'PERS_NIF' }, { nom: 'PERS_COGNOMS_NOM' }],
              criteris: [{ camp: 'UBIC_DEPARTAM_CODI', operador: '=', parametre: 'DEPARTAMENT' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-vincle',
      concepte: 'parametres',
      unitat: '16',
      nivell: 4,
      genera: function () {
        var codis = valorsDe('WAIV9010_PERSONA', 'PLRC_VINCLE_CODI');
        return {
          enunciat: 'La mateixa consulta ha de servir per a funcionaris, interins o laborals segons ' +
                    'el que us diguin en el moment. Feu que <b>pregunti el codi de vincle</b> i ' +
                    'ensenyi el NIF. Anomeneu el parametre <code>VINCLE</code>.',
          pista: 'Es el mateix criteri de sempre sobre <code>PLRC_VINCLE_CODI</code>, pero sense ' +
                 'valor escrit: el valor el posa el parametre. Codis: ' + codis.join(', ') + '.',
          solucio: {
            parametres: { VINCLE: [tria(codis)] },
            consulta: {
              taula: 'WAIV9010_PERSONA',
              camps: [{ nom: 'PERS_NIF' }],
              criteris: [{ camp: 'PLRC_VINCLE_CODI', operador: '=', parametre: 'VINCLE' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-i-criteri-fix',
      concepte: 'parametres',
      unitat: '16',
      nivell: 6,
      genera: function () {
        var organs = valorsDe('WAIV9010_PERSONA', 'UBIC_UN_ORGAN_CODI');
        return {
          enunciat: 'Consulta per repetir cada mes: ha de preguntar el <b>codi d\'unitat organica</b> ' +
                    '(parametre <code>UNITAT</code>) pero el filtre de <b>personal en actiu</b> hi ha ' +
                    'd\'anar fix, perque aixo no canvia mai. Mostreu el NIF i els cognoms.',
          pista: 'Dos criteris units amb <b>and</b>: un parametritzat i un amb el valor escrit. ' +
                 'Nomes el primer porta parametre. Codis d\'unitat: ' + organs.slice(0, 6).join(', ') + '...',
          solucio: {
            parametres: { UNITAT: [tria(organs)] },
            consulta: {
              taula: 'WAIV9010_PERSONA',
              camps: [{ nom: 'PERS_NIF' }, { nom: 'PERS_COGNOMS_NOM' }],
              criteris: [
                { camp: 'UBIC_UN_ORGAN_CODI', operador: '=', parametre: 'UNITAT' },
                { camp: 'IND_ACTIU', operador: '=', valors: ['A'], connector: 'and' }
              ]
            }
          }
        };
      }
    },

    {
      id: 'parametre-entre-dates',
      concepte: 'parametres',
      unitat: '17',
      nivell: 7,
      genera: function () {
        return {
          enunciat: 'Consulta d\'incidencies <b>entre dues dates que es demanaran en executar-la</b>. ' +
                    'Mostreu el NIF i la data d\'inici. Anomeneu el parametre <code>PERIODE</code>.',
          pista: 'L\'operador <b>Entre</b> necessita dos valors, i el parametre els demana tots dos ' +
                 'de cop: la finestra ensenya dues caixes. El criteri va sobre ' +
                 '<code>INCI_DATA_INICI</code>.',
          solucio: {
            parametres: { PERIODE: ['2026-01-01', '2026-06-30'] },
            consulta: {
              taula: 'WAIV9060_INCIDENCI',
              camps: [{ nom: 'PERS_NIF' }, { nom: 'INCI_DATA_INICI' }],
              criteris: [{ camp: 'INCI_DATA_INICI', operador: 'entre', parametre: 'PERIODE' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-estat-de-lloc',
      concepte: 'parametres',
      unitat: '16',
      nivell: 5,
      genera: function () {
        var estats = valorsDe('WAIV9080_LLOC', 'LLOC_ESTAT_PLANT_C');
        return {
          enunciat: 'Consulta de llocs que pregunti l\'<b>estat de plantilla</b> (parametre ' +
                    '<code>ESTAT</code>) i ensenyi el codi i el nom del lloc, ordenats per codi.',
          pista: 'Filtreu pel camp de codi <code>LLOC_ESTAT_PLANT_C</code>, no pel de descripcio, ' +
                 'i no oblideu l\'ordenacio. Estats que hi ha: ' + estats.join(', ') + '.',
          solucio: {
            parametres: { ESTAT: [tria(estats)] },
            consulta: {
              taula: 'WAIV9080_LLOC',
              camps: [{ nom: 'LLOC_CODI' }, { nom: 'LLOC_NOM' }],
              criteris: [{ camp: 'LLOC_ESTAT_PLANT_C', operador: '=', parametre: 'ESTAT' }],
              ordre: [{ camp: 'LLOC_CODI', sentit: 'asc' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-recompte-per-unitat',
      concepte: 'parametres',
      unitat: '17',
      nivell: 7,
      genera: function () {
        var deps = valorsDe('WAIV9010_PERSONA', 'UBIC_DEPARTAM_CODI');
        return {
          enunciat: 'Per al departament que es demani en executar-la (parametre ' +
                    '<code>DEPARTAMENT</code>), obteniu <b>quanta gent hi ha a cada unitat ' +
                    'organica</b>.',
          pista: 'Un parametre i un recompte alhora: agrupeu pel nom d\'unitat organica i compteu ' +
                 'els NIF. El criteri del departament es el que porta el parametre.',
          solucio: {
            parametres: { DEPARTAMENT: [tria(deps)] },
            consulta: {
              taula: 'WAIV9010_PERSONA',
              camps: [{ nom: 'UBIC_UN_ORGAN_NOM' }, { nom: 'PERS_NIF', agregat: 'compte' }],
              criteris: [{ camp: 'UBIC_DEPARTAM_CODI', operador: '=', parametre: 'DEPARTAMENT' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-comenca-per',
      concepte: 'parametres',
      unitat: '17',
      nivell: 8,
      genera: function () {
        return {
          enunciat: 'Consulta de titulacions que pregunti <b>per quines lletres comenca la ' +
                    'descripcio</b> (parametre <code>INICI</code>) i ensenyi el NIF i la descripcio.',
          pista: 'L\'operador es <b>Comença per</b>. Un parametre no serveix nomes per a la ' +
                 'igualtat: qualsevol operador pot prendre el valor d\'un parametre. Les ' +
                 'descripcions van en majuscules: LLICENCIAT, DIPLOMAT, ENGINYER, GRADUAT...',
          solucio: {
            parametres: { INICI: tria([['LLICENCIAT'], ['DIPLOMAT'], ['ENGINYER'], ['GRAD']]) },
            consulta: {
              taula: 'WAIV9040_TITULACIO',
              camps: [{ nom: 'PERS_NIF' }, { nom: 'TITL_DESC_TITULACI' }],
              criteris: [{ camp: 'TITL_DESC_TITULACI', operador: 'comenca-per', parametre: 'INICI' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-amb-dues-taules',
      concepte: 'parametres',
      unitat: '17',
      nivell: 9,
      genera: function () {
        var organs = valorsDe('WAIV9010_PERSONA', 'UBIC_UN_ORGAN_NOM');
        return {
          enunciat: 'Consulta que pregunti el <b>nom de la unitat organica</b> (parametre ' +
                    '<code>UNITAT</code>) i ensenyi, de la gent d\'aquella unitat, el NIF i el ' +
                    '<b>nom del lloc</b> que ocupa.',
          pista: 'Dues taules i un parametre. El parametre va al criteri de la taula de persones; ' +
                 'l\'enllac, del codi de lloc de la persona al codi de lloc de la taula de llocs.',
          solucio: {
            parametres: { UNITAT: [tria(organs)] },
            consulta: {
              taules: ['WAIV9010_PERSONA', 'WAIV9080_LLOC'],
              enllacos: [{ taulaA: 'WAIV9010_PERSONA', campA: 'LLOC_CODI',
                           taulaB: 'WAIV9080_LLOC', campB: 'LLOC_CODI', tipus: 'coincidents' }],
              camps: [{ nom: 'WAIV9010_PERSONA.PERS_NIF' }, { nom: 'WAIV9080_LLOC.LLOC_NOM' }],
              criteris: [{ camp: 'WAIV9010_PERSONA.UBIC_UN_ORGAN_NOM', operador: '=', parametre: 'UNITAT' }]
            }
          }
        };
      }
    },

    {
      id: 'parametre-llista',
      concepte: 'parametres',
      unitat: '17',
      nivell: 8,
      genera: function () {
        var cats = valorsDe('WAIV9010_PERSONA', 'PLRC_COS_CATEGOR_C');
        return {
          enunciat: 'Consulta que pregunti <b>una o mes categories</b> (parametre ' +
                    '<code>CATEGORIES</code>) i ensenyi el NIF i la descripcio de la categoria.',
          pista: 'L\'operador <b>Llista</b> admet tants valors com calgui, i el parametre tambe: ' +
                 'la finestra que els demana ensenya una caixa per valor. Categories: ' +
                 cats.join(', ') + '.',
          solucio: {
            parametres: { CATEGORIES: cats.slice(0, 2) },
            consulta: {
              taula: 'WAIV9010_PERSONA',
              camps: [{ nom: 'PERS_NIF' }, { nom: 'PLRC_COS_CATEGOR_D' }],
              criteris: [{ camp: 'PLRC_COS_CATEGOR_C', operador: 'llista', parametre: 'CATEGORIES' }]
            }
          }
        };
      }
    },

  ];

  var CONCEPTES = [
    { id: 'criteris',        nom: 'Criteris i operadors',        unitats: '06 · 07 · 08 · 09' },
    { id: 'and-or',          nom: 'AND, OR i parèntesis',        unitats: '07' },
    { id: 'camps-buits',     nom: 'Camps de text buits',         unitats: '09 · 18' },
    { id: 'recomptes',       nom: 'Recomptes i agregats',        unitats: '10 · 12' },
    { id: 'registres-unics', nom: 'Registres únics',             unitats: '11' },
    { id: 'vigencia',        nom: 'Vigència i períodes',         unitats: '13' },
    { id: 'historic',        nom: 'Històric persona-lloc',       unitats: '14' },
    { id: 'multitaula',      nom: 'Consultes amb dues taules',   unitats: '08 · 13' },
    { id: 'operadors',       nom: 'Operadors de text i negacions', unitats: '06 · 13 · 18' },
    { id: 'numerics',        nom: 'Camps numèrics i agregats',   unitats: '09 · 10 · 14' },
    { id: 'ordenacio',       nom: 'Ordenació dels resultats',    unitats: '05' },
    { id: 'titulacions',     nom: 'Titulacions i registres múltiples', unitats: '12' },
    { id: 'tres-taules',     nom: 'Consultes amb tres taules',   unitats: '08 · 13 · 14' },
    { id: 'parametres',      nom: 'Consultes parametritzades',   unitats: '16 · 17' }
  ];

  /* Un exercici la resposta del qual es "cap registre" no ensenya res: no
     distingeix qui l'ha resolt be de qui s'ha equivocat de camp. Si la
     combinacio de valors sortejada dona buit, es torna a sortejar. */
  /* La solucio d'un exercici de parametres no es pot executar tal qual: li
     falten els valors. L'exercici en porta uns de prova, i son aquests els que
     fan servir tant el generador com el corrector. */
  function executaSolucio(sol) {
    if (!sol.parametres) return Motor.executa(sol.consulta);
    return Motor.executa(Object.assign({}, sol.consulta, { valorsParametres: sol.parametres }));
  }

  function genera(plantilla) {
    var ex, r;
    for (var intent = 0; intent < 12; intent++) {
      ex = construeix(plantilla);
      r = executaSolucio(ex.solucio);
      if (!r.error && r.registres > 0) break;
    }
    return ex;
  }

  function construeix(plantilla) {
    var ex = plantilla.genera();
    ex.id = plantilla.id;
    ex.concepte = plantilla.concepte;
    ex.unitat = plantilla.unitat;
    ex.nivell = plantilla.nivell;
    ex.solucio.registres = executaSolucio(ex.solucio).registres;
    return ex;
  }

  function generaPerConcepte(concepte) {
    var cand = PLANTILLES.filter(function (p) { return !concepte || p.concepte === concepte; });
    return genera(tria(cand));
  }

  /* Els exercicis del tutorial porten un codi com EX-06-2. El simulador no
     guarda cap exercici fix -els genera-, aixi que el codi s'enten com "una
     de les d'aquesta unitat": qui hi arriba des del tutorial es troba
     practicant justament el que acaba de llegir. */
  function generaPerCodi(codi) {
    var m = /EX-(\d{2})/i.exec(String(codi || ''));
    if (!m) return null;
    var unitat = m[1];
    var cand = PLANTILLES.filter(function (p) { return p.unitat === unitat; });
    return cand.length ? genera(tria(cand)) : null;
  }

  function generaPerId(id) {
    var p = PLANTILLES.filter(function (x) { return x.id === id; })[0];
    return p ? genera(p) : null;
  }

  return {
    PLANTILLES: PLANTILLES, CONCEPTES: CONCEPTES,
    genera: genera, generaPerConcepte: generaPerConcepte, generaPerId: generaPerId,
    generaPerCodi: generaPerCodi,
    executaSolucio: executaSolucio
  };
})();
