# Click & Decide - Guia d'aprenentatge

Curs pràctic per aprendre a explotar les dades administratives de personal de les
taules de la WAI amb Click & Decide Builder.

Una unitat de fonaments sobre el model de dades i divuit unitats que segueixen la
sèrie oficial de l'Escola d'Administració Pública de Catalunya, ampliades amb el
contingut de la guia de la wiki de l'EAPC i del manual bàsic del GIP-SIP.

## Com s'obre

Doble clic a `index.html`. No cal servidor, ni instal·lació, ni connexió a
internet. Funciona a Chrome, Edge, Firefox i Safari.

## Estructura

```
index.html            portada i índex de les 19 unitats
assets/styles.css     full d'estil únic
assets/tutorial.js    índex lateral actiu, navegació i visor d'imatges
unitats/NN/           una carpeta per unitat, amb les seves imatges a img/
```

## Navegació

- Fletxes `<-` i `->` del teclat per anar a la unitat anterior i a la següent.
- Desplegable **Unitats** a la capçalera per saltar a qualsevol punt.
- Índex lateral que marca l'apartat que s'està llegint.
- Les figures s'obren a pantalla completa amb un clic; un segon clic les amplia a
  mida real i `Esc` tanca el visor.

## Les quatre taules del curs

| Taula | Clau | Tipus de registre | Vigència |
|---|---|---|---|
| `WAIV9010_PERSONA` | `PERS_NIF` | Únics | Actuals, dia anterior |
| `WAIV9080_LLOC` | `LLOC_CODI` | Únics | Actuals, dia anterior |
| `WAIV9060_INCIDENCI` | - | Múltiples | Actuals i històriques |
| `WAIV9030_PUNTERH` | - | Múltiples | Actuals i històriques |

## Exercicis

Cada unitat acaba amb exercicis de tres menes: reproduir una consulta guiada,
trencar-la a propòsit per entendre l'error, i resoldre un encàrrec sense
instruccions.

Cada exercici té un codi estable, del tipus `EX-04-3`. El simulador fa servir els
mateixos codis al seu catàleg, de manera que les dues peces es poden utilitzar
per separat: el curs s'entén sense el simulador i el simulador funciona sense el
curs.

Els resultats de comprovació dels exercicis són provisionals i s'han de
recalcular contra les dades del simulador.

## Autoria

Guia elaborada per **Ismael Trascastro**: estructura del curs, redacció, esquemes
i exercicis.

El simulador que l'acompanya, pensat per practicar-hi els conceptes sobre dades
generades, és també obra seva i es distribueix per separat.

Els continguts originals de l'EAPC en què es basa aquesta guia es difonen sota
llicència Creative Commons BY-NC-SA, que obliga a citar-ne la font i l'autoria,
a no fer-ne un ús comercial i a difondre les obres derivades amb la mateixa
llicència. Aquesta guia n'és una obra derivada i manté aquestes condicions.

## Fonts

- *Guia bàsica per a l'ús de Click & Decide (C&D) per al tractament de dades
  administratives de personal*, unitats 1, 2 i 3. Escola d'Administració Pública
  de Catalunya. Continguts de Cristina Garcia Rodríguez, Marta Cuesta Vilar i
  Óscar Asensio Garcia. Llicència Creative Commons BY-NC-SA.
- Sèrie de vídeos del canal *eapccat*.
- *Click & Decide Builder. Manual bàsic resumit aplicat a la base de dades del
  GIP-SIP*, Assumpta Aguiló Munárriz, novembre de 2014. Llicència Creative
  Commons BY-NC-ND.

Material d'estudi. No substitueix la documentació oficial de cada taula, que s'ha
de consultar sempre a la intranet corporativa.
