# DAM_0490 - Programació de serveis i processos · Materials Jekyll

Materials del mòdul DAM_0490 amb el mateix sistema de documentació Jekyll utilitzat a `ioc-dam_0488`: navegació per unitats, blocs i seccions, components educatius reutilitzables, ressaltat de codi i quadern de notes.

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

## Unitat 1

**Processos i fils (RA1, RA2)**

1. Entendre què passa quan hi ha diverses tasques.
2. Crear i controlar processos des de Java.
3. Fils, memòria compartida i sincronització.
4. Gestionar moltes tasques amb `ExecutorService`.

Els continguts estan plantejats amb exemples petits i progressius abans d'arribar a situacions més completes.

## Build local

```bash
cd docs
bundle exec jekyll build
```

La configuració de desplegament utilitza el base URL `/ioc/dam_0490`.
