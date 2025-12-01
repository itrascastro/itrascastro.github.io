# Curs Angular - Documentació Jekyll

Aquest és un sistema de documentació educativa construït amb Jekyll per al curs d'Angular. El sistema proporciona una experiència d'aprenentatge rica amb components interactius i navegació intel·ligent.

## Característiques

- **Layout de 3 columnes**: TOC del bloc, contingut principal, i índex del curs
- **Components educatius reutilitzables**: Definicions, objectius, blocs de codi, error-solució, prompts d'IA
- **Navegació automàtica**: TOC generat dinàmicament amb scroll spy
- **Mode fosc/clar**: Suport complet per a preferències del usuari
- **Responsive design**: Adaptat per a mòbils i tablets
- **SEO optimitzat**: Structured data i meta tags automàtics

## Estructura del Projecte

```
docs/
├── _config.yml          # Configuració Jekyll
├── _layouts/            # Plantilles de pàgina
│   ├── default.html     # Layout base de 3 columnes
│   └── bloc.html        # Layout específic per blocs
├── _includes/           # Components reutilitzables
│   ├── objectius.html   # Objectius d'aprenentatge
│   ├── definicio.html   # Caixes de definició
│   ├── code-block.html  # Blocs de codi
│   ├── error.html      # Errors i problemes
│   ├── solucio.html    # Solucions alternatives
│   ├── prompt-ai.html   # Prompts per IA
│   ├── suggeriment.html # Suggeriments d'ampliació
│   ├── toc.html         # Taula de continguts
│   └── course-index.html # Índex del curs
├── _sass/               # Estils SCSS
│   ├── _variables.scss  # Variables CSS i colors
│   ├── _mixins.scss     # Mixins SCSS
│   ├── _base.scss       # Estils base
│   ├── _layout.scss     # Layout i estructura
│   ├── _components.scss # Components generals
│   ├── _educational.scss # Components educatius
│   └── _responsive.scss # Media queries
├── assets/
│   ├── css/style.scss   # Fitxer principal CSS
│   └── js/main.js       # JavaScript principal
└── unitat-X/           # Contingut del curs per unitats
    └── bloc-X.md       # Blocs individuals
```

## Ús dels Components

### Objectius d'Aprenentatge

```liquid
{% include objectius.html
   objectius='["Objectiu 1", "Objectiu 2", "Objectiu 3"]'
%}
```

### Definicions

```liquid
{% include definicio.html
   terme="Component"
   contingut="Classe TypeScript que controla una part de la interfície"
   exemple="@Component define un component Angular"
   veure_mes="https://angular.io/guide/component-overview"
%}
```

### Blocs de Codi

```liquid
{% include code-block.html
   lang="typescript"
   filename="src/app/component.ts"
   code="export class MyComponent { }"
%}
```

**Opcions avançades:**

```liquid
{% include code-block.html
   lang="typescript"
   filename="src/app/component.ts"
   highlight="1-3,5"
   code="import { Component } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: '<h1>Hello World</h1>'
})
export class MyComponent { }"
%}
```

### Error i Solució

```liquid
{% include error.html
   contingut="Error de compilació: Cannot find module 'rxjs'. Dependència no instal·lada."
%}

{% include solucio.html
   contingut="Executa <code>npm install</code> per instal·lar les dependències."
%}

{% include solucio.html
   contingut="Alternativament, executa <code>npm ci</code> per una instal·lació més ràpida."
%}
```

### Prompts d'IA

```liquid
{% include prompt-ai.html
   titol="Millora el component amb IA"
   contingut="Utilitza IA per generar codi més eficient"
   context="Tens un component bàsic Angular"
   exemples='["Com optimitzar aquest component?", "Com afegir tests?"]'
   eines='["ChatGPT", "GitHub Copilot"]'
   avantatges='["Codi més ràpid", "Millors pràctiques"]'
%}
```

### Suggeriments

```liquid
{% include suggeriment.html
   titol="Afegir animations"
   contingut="Implementa animacions per millorar UX"
   dificultat="Mitjà"
   passos='["Importar AnimationsModule", "Definir animacions", "Aplicar al template"]'
   temps="2 hores"
   tecnologies='["@angular/animations", "CSS"]'
   beneficis='["Millor experiència usuari", "App més professional"]'
%}
```

## Configuració d'un Nou Bloc

1. Crear fitxer `unitat-X/bloc-Y.md`
2. Afegir frontmatter amb metadades:

```yaml
---
layout: bloc
title: "Títol del Bloc"
description: "Descripció del bloc"
unitat: 1
bloc_numero: 1
durada: "2 hores"
dificultat: "Principiant"
sidebar: true

objectius:
  - "Objectiu 1"
  - "Objectiu 2"

exercicis:
  - nom: "Exercici 1"
    descripcio: "Descripció de l'exercici"
    dificultat: "Fàcil"
    temps: "30 min"

recursos:
  - nom: "Recurs extern"
    url: "https://example.com"
    tipus: "📚 Documentació"
    external: true
---
```

3. Escriure el contingut utilitzant Markdown i components
4. Actualitzar `_config.yml` si és necessari

## Desenvolupament Local

### Prerequisits

- Ruby 3.0+
- Bundler
- Jekyll

### Instal·lació

```bash
cd docs/
bundle install
```

### Executar localment

```bash
bundle exec jekyll serve --livereload
```

El site estarà disponible a `http://localhost:4000`

### Build per producció

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

## GitHub Pages

El projecte està configurat per desplegar-se automàticament a GitHub Pages mitjançant GitHub Actions. El workflow es troba a `.github/workflows/jekyll.yml`.

### Configuració

1. Activar GitHub Pages al repositori
2. Seleccionar "GitHub Actions" com a font
3. Pushes a `main` que modifiquin `/docs/**` activaran el build

## Personalització

### Colors i Tema

Els colors es defineixen a `_sass/_variables.scss` utilitzant CSS custom properties:

```scss
:root {
  --primary-color: #007acc;
  --secondary-color: #6c757d;
  // ...
}
```

### Fonts

Les fonts es configuren a `_sass/_variables.scss`:

```scss
:root {
  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'SF Mono', monospace;
}
```

### Layout

El layout de 3 columnes es pot modificar ajustant les variables a `_sass/_variables.scss`:

```scss
:root {
  --sidebar-width: 280px;
  --max-content-width: 1200px;
}
```

## Contribució

1. Fork el repositori
2. Crear una branca per la funcionalitat: `git checkout -b feature/nova-funcionalitat`
3. Commit els canvis: `git commit -m 'Afegir nova funcionalitat'`
4. Push a la branca: `git push origin feature/nova-funcionalitat`
5. Obrir un Pull Request

## Suport

Per reportar problemes o suggerir millores, obre un issue al repositori GitHub.

## Llicència

Aquest projecte està sota llicència MIT. Veure `LICENSE` per més detalls.