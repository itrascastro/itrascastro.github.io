# Simulador de Click & Decide

Laboratori per practicar consultes sobre les taules de la WAI. Genera exercicis
sense repetir-se i **corregeix**: quan la consulta no és la que demanava
l'encàrrec, diu què heu fet, per què està malament i com hauria de quedar.

## Com s'obre

Doble clic a `index.html`. No necessita servidor, ni instal·lació, ni connexió.

## Què reprodueix

No és un motor SQL genèric: imita el comportament de Click & Decide, incloses
les seves rareses, perquè són justament el que s'ha d'aprendre.

- Els camps `Char` es guarden **farcits d'espais** fins a la seva longitud. D'aquí
  surt, sense cap regla especial, que `És nul` no trobi mai res en un camp de
  text i que calgui comparar-lo amb un espai.
- Els **vint operadors** del desplegable, amb el seu nom català.
- Els criteris s'uneixen amb **and** per defecte, i l'**and** lliga més fort que
  l'**or**: sense parèntesi, el resultat surt inflat.
- Els **tres comptadors**: `Agregats > Compte`, `Distinct Agregats > Compte` i
  `Compte(*)`.
- La propietat **Registres únics**.

## Les dades

Quatre taules amb 930 registres generats. No són dades de cap persona real.

| Taula | Files | Clau |
|---|---|---|
| `WAIV9010_PERSONA` | 180 | `PERS_NIF` |
| `WAIV9080_LLOC` | 210 | `LLOC_CODI` |
| `WAIV9060_INCIDENCI` | 90 | cap, registres múltiples |
| `WAIV9030_PUNTERH` | 450 | cap, registres múltiples |

Els camps amb prefix `SIM_` són pedagògics i no existeixen a la WAI real.

## Relació amb la guia d'aprenentatge

Es poden fer servir per separat. Els exercicis del curs que porten codi `EX-`
són casos concrets de les mateixes plantilles que hi ha aquí.

## Autoria

Ismael Trascastro.

## Comprovacions

Quatre eines, cadascuna mira una cosa que les altres no poden veure.

    node eines/proves.js            el nucli: motor, farciment, enllacos, propietats
    node eines/repas.js             totes les variants de tots els exercicis
    node eines/repas-interficie.js  els exercicis passats per la pantalla
    node eines/repas-a-mans.js      els exercicis resolts amb els controls
    node eines/coherencia.js        que l'enunciat digui el que la solucio resol
    node eines/dades.js             que el joc de dades sigui coherent

`proves.js` comprova que el motor es comporta com Click & Decide: el
farciment amb espais, la precedencia de l'and, els tres comptadors, els dos
tipus d'enllac i les xifres de control del tutorial.

`repas.js` recorre les variants del cataleg i sobre cadascuna hi simula els
errors que qualsevol cometria. Mira dues coses: que la solucio bona es dona
per bona, i que cada error rep un diagnostic concret. Un exercici que no es
pot encertar no es un exercici, i un error que nomes rep un "el resultat no
coincideix" no ensenya res. Amb `-v` en surt el detall.

`coherencia.js` no mira si l'exercici funciona sino si diu la veritat: un
enunciat que demana una cosa i en resol una altra s'executa perfectament i es
dona per bo. Contrasta el text amb la consulta -- si diu "quantes" ha de
comptar, si diu "de cada" ha d'agrupar, si anomena un mes les dates hi han de
caure, si diu "Mostreu A i B" han de sortir dos camps, i cap valor concret no
pot sortir del no-res.

`dades.js` mira les dades mateixes: claus que no es repeteixin, referencies
que apuntin a alguna banda, dates que no acabin abans de comencar, trams de
l'historic que no se superposin i codis que no es puguin donar alhora. Un joc
de dades incoherent no fa fallar res, pero ensenya sobre una realitat que no
existeix.

Els dos de la interficie necessiten un Chrome instal·lat i obren el simulador tal com
l'obre qui practica, amb doble clic i sense servidor. `repas-interficie.js`
hi carrega la solucio de cada exercici i la corregeix des de la pantalla:
comprova que el que es veu i el que es corregeix son la mateixa cosa.
`repas-a-mans.js` va mes enlla i munta cada consulta amb els controls, un a
un, com ho faria una persona: marca taules, defineix enllacos, tria camps,
posa agregats pel boto dret, obre la finestra de criteris, escriu els valors,
combina els parentesis i ordena. Es l'unica manera de saber que tots els
exercicis es poden resoldre de veritat.
