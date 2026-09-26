# DAM_0490 - Programació de serveis i processos · Materials Jekyll

Materials del mòdul DAM_0490 amb la mateixa infraestructura Jekyll de `ioc-dam_0488`: navegació per unitats, blocs i seccions, components educatius reutilitzables, ressaltat de codi i quadern de notes.

## Estructura

```
docs/
├── _config.yml
├── _layouts/ _includes/ _sass/ assets/
├── unitat-1/
│   ├── index.html
│   ├── descripcio.html
│   ├── bloc-1/
│   ├── bloc-2/
│   ├── bloc-3/
│   └── bloc-4/
└── assets/img/unitat-1/
```

## Build local

```bash
cd docs
bundle exec jekyll build
```

El resultat es publica a `https://itrascastro.github.io/ioc/dam_0490/` copiant `docs/_site/` a la carpeta `ioc/dam_0490/` del repositori `itrascastro.github.io`.

## Criteri de manteniment

La infraestructura del tema es manté igual que a `ioc-dam_0488`. Les adaptacions del mòdul es concentren a `_config.yml`, als continguts de `unitat-1` i a les imatges pròpies de la unitat.
