# Plantilla JSON del Rellotge i tauler (versió IOC)

Un únic fitxer JSON configura tota la pantalla. Un agent només ha de canviar valors i importar-lo:
**Configuració → Desar → Plantilles → Importa una plantilla**, i després **Aplica** (o `applyTemplateData(data)` des de la consola).

`presets/exemple-complet.json` té **tots** els paràmetres amb els valors per defecte; es genera amb
`node test/dump-defaults.mjs` des del codi de l'app, així que no pot quedar desfasat. `presets/proves-compleccio.json`
és un exemple real (només contingut).

## Format

```json
{ "app": "Rellotge-IOC-Plantilla", "version": 2, "revision": 1, "name": "Nom visible", "data": { ... } }
```

- `revision` (opcional, número) només serveix a la plantilla per defecte d’un lloc: en pujar-lo, qui ja tenia una versió anterior
  rep una pregunta, una sola vegada, per aplicar la nova. Mai se substitueix res sense preguntar.
- Totes les claus de `data` són opcionals. **Una clau absent no es toca** (es manté el valor actual); una clau present
  se sanea i substitueix el valor. Un valor invàlid cau al valor per defecte, mai trenca l'app.
- No hi ha estat d'execució a la plantilla (cronòmetre, temporitzador en marxa): només configuració.
- Les imatges (logo propi, seccions amb imatge) van com a `data:image/...;base64,...` dins del JSON. L’app les escriu **al final**
  (`logoDark` i `logoLight` en acabar `data`, `image` en acabar cada secció) perquè la resta es pugui llegir i editar.

## Paràmetres (`data`)

| Clau | Valors | Per defecte |
|---|---|---|
| `title` | text ≤ 120 | `Benvinguts` |
| `subtitle`, `room`, `board` | text ≤ 120 (`board` per defecte `Tauler de l’aula`) | `` |
| `banner` | text ≤ 330, buit = sense avís fix | `` |
| `bannerLevel`, `noteLevel` | `info` `success` `important` `urgent` `note` | `info` |
| `clockMode` | `schedule` fites · `target` fins a una hora · `timer` · `stopwatch` · `clock` | `clock` |
| `enabledModes` | llista no buida de modes disponibles (les pestanyes del rellotge): `schedule` `target` `timer` `stopwatch` `clock`. `clockMode` ha de ser-ne un; si no, passa al primer | tots cinc |
| `clockLabel` | text ≤ 60 sota l’hora (buit = res; al mode `clock` surt la data) | `` |
| `clockNote` | text ≤ 140, missatge sota el rellotge (buit = res) | `` |
| `target` | `HH:MM` (mode `target`) | `` |
| `timerMinutes` | 1–600 (80 = 1 h 20 min, 110 = 1 h 50 min, 120 = 2 h) | `60` |
| `timerBeep` | bool, avís sonor en acabar | `true` |
| `seconds` | bool, mostra els segons | `false` |
| `schedule` | `[]` = sense fites (permès); fins a 16 fites `{ "t":"HH:MM", "name":"…", "show":bool, "msg":"…" }` (`show` = surt a la línia del dia; `msg` = missatge durant la fase) | 4 d’exemple |
| `autoHint` | bool, mostra «Falten N min per a <fita>» sota el rellotge durant els minuts d’avís (`warnMin`) si la fita no té missatge propi | `false` |
| `warnMin` | 0–30 minuts d’avís de color (0 = mai) | `5` |
| `tintMode` | `screen` tota la pantalla · `ring` només l’aro · `none` | `screen` |
| `layout` | 0–100, % de pantalla pel rellotge (0 = només missatges, 100 = només rellotge) | `50` |
| `theme` | `system` `light` `dark` | `system` |
| `accent` | `blue` `green` `purple` `orange` `pink` `teal` `emerald` | `blue` |
| `bgColor` | `default` `cream` `mint` `sky` `rose` `lilac` `graphite` `slate` | `default` |
| `textSize` | `small` `normal` `large` `xlarge` (text de les seccions) | `normal` |
| `listStyle` | `cards` `numbers` `bullets` | `cards` |
| `labelSize`, `noteSize` | `s` `m` `l` `xl` | `m` |
| `labelAccent` | bool, text sota l’hora en color d’accent | `false` |
| `dial` | 40–100, mida del rellotge en % | `100` |
| `logoMode` | `ioc` (predeterminat) · `custom` | `ioc` |
| `logoDark`, `logoLight` | data URI (png/jpg/webp/gif/svg) per a fons fosc / clar | `` |
| `logoAlt` | text alternatiu ≤ 80 | `` |
| `logoScale` | 50–160 | `100` |
| `showLogo` `showTitle` `showTabs` `showTag` `showLabel` `showRing` `showNote` `showDay` `showControls` | bool, elements visibles | `true` |
| `idle` | 0–30 s per amagar els controls (0 = mai) | `4` |
| `autoRotate`, `rotateSeconds` | bool · 10–300 s entre seccions | `true` · `45` |
| `slides` | fins a 30 seccions (vegeu sota) | 1 de benvinguda |

### Seccions (`slides[]`)

```json
{ "kind": "list", "title": "Normes", "content": "Un punt\nper línia", "visible": true, "accent": "theme", "image": "" }
```

- `kind`: `list` (un punt per línia) · `text` (paràgrafs separats per línia en blanc) · `notice` (avís gran) ·
  `table` (una fila per línia, fins a 5 columnes separades per `|`, la primera fila és la capçalera) · `image` (`image` = data URI i `content` = peu de foto).
- `accent`: `theme` (color del tema) `blue` `mint` `gold` `coral` `purple`.
- `content` ≤ 2200, `title` ≤ 100. Les seccions amb `visible:false` no surten ni a la rotació.

## Garanties (comprovades per la bateria de proves)

- Importar un JSON amb **tots** els paràmetres en valors no per defecte aplica cadascun exactament (`test/run-tests.mjs`,
  «one JSON holds the whole configuration»), i la prova falla si es crea un paràmetre nou sense cobrir-lo.
- «Desa la configuració actual» guarda aparença, rellotge, logo i contingut, i es restaura sencer.
- Tot el que es mostra és text pla: ni HTML ni scripts del JSON s’executen.
