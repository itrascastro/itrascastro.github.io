# Guia per Editors de Materials IOC
{% raw %}

## Objectiu
Aquest document explica com crear i editar continguts educatius seguint l'arquitectura simplificada d'aquest sistema.

## Estructura de Fitxers

```
unitat-X/
└── bloc-Y.html               ← TU EDITES AQUÍ
```

## QUÈ POTS FER

### **HTML + Components Jekyll NOMÉS:**

```html
<div class="section">
    <h2 id="Unitat1_Bloc1_Seccio1">Títol de la Secció</h2>
    
    <p>Contingut educatiu amb <strong>text destacat</strong> i <em>cursiva</em>.</p>

    {% include info_box.html
       contingut="<strong>Definició:</strong> Angular és un framework complet..."
    %}

    <h3>Subtítol</h3>

    <ul>
        <li><strong>Element destacat:</strong> Descripció</li>
        <li>Element normal de la llista</li>
    </ul>

    {% include code-block.html
       lang="bash"
       code="# Exemple de codi
npm install -g @angular/cli
ng version"
    %}

    {% include warning_box.html
       contingut="<strong>Nota important:</strong> El primer build pot trigar..."
    %}

    {% include success_box.html
       contingut="<strong>Objectius aconseguits:</strong>
<ul>
<li>Primera tasca completada</li>
<li>Segona tasca completada</li>
</ul>"
    %}
</div>
```

## Components Jekyll Disponibles

### Caixa Informativa:
```jekyll
{% include info_box.html
   contingut="<strong>Informació:</strong> Text explicatiu amb <em>HTML</em>..."
%}
```

### Caixa d'Advertiment:
```jekyll
{% include warning_box.html
   contingut="<strong>Atenció:</strong> Text d'advertiment amb <code>codi</code>..."
%}
```

### Caixa d'Èxit:
```jekyll
{% include success_box.html
   contingut="<strong>Completat:</strong> Text amb llistes HTML
<ul>
<li>Primera tasca</li>
<li>Segona tasca</li>
</ul>"
%}
```

### Bloc de Codi:
```jekyll
{% include code-block.html
   lang="bash"
   code="npm install
ng serve"
%}
```

**Opcions avançades:**
```jekyll
{% include code-block.html
   lang="typescript"
   filename="src/app/component.ts"
   highlight="1-3,5"
   code="import { Component } from '@angular/core';

@Component({
  selector: 'app-my-component'
})
export class MyComponent { }"
%}
```

### Prompt per IA:
```jekyll
{% include prompt-ai.html
   contingut="<strong>Prompt per IA:</strong>
<p>Text del prompt amb <em>format HTML</em>...</p>"
%}
```

### Error:
```jekyll
{% include error.html
   contingut="Error: ng command not found després d'instal·lar Angular CLI."
%}
```

### Solució:
```jekyll
{% include solucio.html
   contingut="Reinicia el terminal o executa source ~/.bashrc per actualitzar les variables d'entorn."
%}

{% include solucio.html
   contingut="Alternativament, tanca i obre un nou terminal completament."
%}
```

### Suggeriment:
```jekyll
{% include suggeriment.html
   contingut="<strong>Suggeriment:</strong> Text del suggeriment amb <code>exemples</code>..."
%}
```

### Checklist:
```jekyll
{% include checklist.html
   titol="Verificació del Projecte"
   elements="El projecte es crea sense errors|L'aplicació s'executa correctament amb ng serve|Es pot accedir a l'aplicació des del navegador|La recàrrega automàtica funciona en fer canvis"
%}
```

## ❌ QUÈ NO POTS FER

### **Classes CSS Personalitzades:**
```html
<!-- ❌ PROHIBIT -->
<div class="classe-personalitzada">
<span style="color: red;">
```

### **JavaScript:**
```html
<!-- ❌ PROHIBIT -->
<script>
onclick="algo()"
```

### **Markdown:**
```text
❌ NO USAR MARKDOWN - Només HTML + Components Jekyll:
**text en negreta**
*text cursiva*
```

## 📋 Flux de Treball

1. **Troba el fitxer**: `unitat-X/bloc-Y.html`
2. **Edita HTML + Jekyll**: Contingut educatiu amb components Jekyll
3. **Usa components aprovats**: Només els components Jekyll llistats
4. **Text en HTML**: `<strong>`, `<em>`, `<code>`, `<ul>`, `<li>`, etc.
5. **Estructura en seccions**: Cada secció dins de `<div class="section">`
6. **Guarda i commiteja**: Git guardarà els canvis
7. **Revisió tècnica**: Un tècnic validarà abans de publicar

## 🎨 Exemple Complet

## Estructura del Curs (Unitats i Blocs)

Estructura bàsica dins de `docs/`:

```
docs/
├─ unitat-1/
│  ├─ index.html                 # Pàgina de la unitat 1
│  ├─ descripcio.html            # Descripció HTML OBLIGATÒRIA de la unitat 1
│  ├─ bloc-1/
│  │  ├─ index.html             # Contingut del Bloc 1.1 (layout: bloc)
│  │  └─ descripcio.html        # Descripció HTML OBLIGATÒRIA del bloc 1.1
│  └─ bloc-2/
│     ├─ index.html             # Contingut del Bloc 1.2
│     └─ descripcio.html        # Descripció HTML del Bloc 1.2
├─ unitat-2/
│  ├─ index.html
│  ├─ descripcio.html
│  ├─ bloc-3/
│  └─ bloc-4/
└─ ...
```

Notes importants:
- Cada unitat ha de tenir `descripcio.html` (obligatori). Aquest fitxer pot contenir HTML lliure (paràgrafs, llistes, enllaços, imatges...).
- Cada bloc viu a `bloc-<n>/` i ha de tenir:
  - `index.html` amb front‑matter i contingut del bloc.
  - `descripcio.html` amb la descripció curta (3–6 punts) que es mostra a la pàgina de la unitat.
- Els enllaços a blocs en configuració (`_config.yml`) apunten a `/unitat-<n>/bloc-<m>/` (barra final) per fer correspondre `index.html`.

## Pàgina d’Unitat (`unitat-*/index.html`)

- No inclou la descripció a la capçalera. La descripció es mostra en una secció pròpia:

```
<div class="unit-introduction">
  <h2>Descripció de la Unitat</h2>
  {% include_relative descripcio.html %}
  <!-- Editeu docs/unitat-<n>/descripcio.html -->
</div>
```

- La llista de blocs mostra la descripció carregada via include relatiu al bloc:

```
<div class="block-description">
  {% include_relative bloc-{{ bloc.numero }}/descripcio.html %}
</div>
```

## 📄 Pàgina de Bloc (`bloc-*/index.html`)

Front‑matter recomanat:

```
---
layout: bloc
title: "Bloc X: Títol"
description: "Descripció breu del bloc"
unitat: N
bloc: X
bloc_numero: X
---
```

Bones pràctiques de contingut:
- Seccions principals amb `h2` (necessari per a la barra de progrés de seccions i TOC).
- Subsections amb `h3`.
- Fragments de codi amb el component `code-block` per conservar format i còpia:

```
{% include code-block.html
   lang="typescript"
   code="\nimport { Component } from '@angular/core';\n// ...\n" %}
```

## 🔗 OBLIGATORI: IDs Jeràrquics per Seccions H2

**IMPORTANT:** Tots els `<h2>` han de tenir un atribut `id` que segueixi la convenció jeràrquica per al funcionament correcte del sistema de navegació del quadern de notes.

### Convenció Obligatòria:
```
Unitat{N}_Bloc{M}_Seccio{X}
```

### Exemples Correctes:
```html
<!-- Unitat 1, Bloc 1 -->
<h2 id="Unitat1_Bloc1_Seccio1">Introducció a Angular</h2>
<h2 id="Unitat1_Bloc1_Seccio2">Configuració de l'Entorn</h2>

<!-- Unitat 2, Bloc 3 -->
<h2 id="Unitat2_Bloc3_Seccio1">Components</h2>
<h2 id="Unitat2_Bloc3_Seccio2">Directives</h2>

<!-- Unitat 4, Bloc 8 -->
<h2 id="Unitat4_Bloc8_Seccio1">Introducció</h2>
```

### ❌ Exemples Incorrectes:
```html
<h2>Títol sense ID</h2>              ← No funciona amb el quadern
<h2 id="introduccio">Títol</h2>      ← Format antic, no jeràrquic
<h2 id="seccio-1">Títol</h2>         ← Format incorrecte
```

### Per què són Necessaris?
- **Sistema de navegació:** El quadern de notes detecta automàticament les seccions
- **Creació de notes:** Cada secció pot tenir múltiples notes associades
- **Estructura jeràrquica:** Permet navegar per unitats → blocs → seccions
- **IDs únics:** Evita conflictes entre seccions de diferents blocs

Mini‑checklist d’IDs:
- Cada secció principal és un `h2`.
- Cada `h2` té un `id` únic amb format `UnitatN_BlocM_SeccioX`.
- Els `id` coincideixen amb els definits a `docs/_config.yml` (apartat `seccions`).

## Descripcions OBLIGATÒRIES

- Unitat: `descripcio.html`
  - Contingut: resum (80–150 paraules), punts clau, enllaços interns.
  - Exemple i pautes dins del mateix fitxer (comentaris HTML inicials).

- Bloc: `bloc-<n>/descripcio.html`
  - Contingut: 3–6 punts clau (llista curta) sobre el que s’aprèn.
  - Exemple i pautes dins del mateix fitxer (comentaris HTML inicials).

## Navegació i estil

- Portada: títols d’unitat enllaçats sense subratllat (estil de títol preservat).
- Breadcrumb: en mode fosc, només els enllaços en blau; l’element actual es manté neutre.
- Botons: estil neutre en clar i coherent en fosc.

## Accessibilitat i Progrés

- Cada `h2` del bloc alimenta la barra de progrés de seccions del peu de pàgina.
- Mantingueu títols clars i un ordre lògic de seccions.

## Configuració (`_config.yml`)

- La jerarquia del curs es defineix a `docs/_config.yml` → `curs.unitats[].blocs[]`.
- Cada bloc declara `url` i les seves `seccions` (ids i títols).
- Exemple d’entrada de bloc:

```yaml
blocs:
  - nom: "Bloc 1"
    numero: 1
    descripcio: "..."
    url: "/unitat-1/bloc-1/"
    seccions:
      - { id: "Unitat1_Bloc1_Seccio1", titol: "Introducció" }
      - { id: "Unitat1_Bloc1_Seccio2", titol: "Contingut" }
```

## Evitar

- Descripcions llargues a la portada del curs.
- Codi extens sense el component `code-block` (pot perdre format).
- Feedback embedit al final de blocs (el peu de pàgina no inclou feedback).

{% endraw %}


```html
---
layout: default
title: "Bloc X: Títol del Bloc"
description: "Descripció breu del contingut"
keywords: "paraules, clau, separades, per, comes"
unit: 1
block: 1
---

<div class="section">
    <h2 id="Unitat1_Bloc1_Seccio1">Introducció</h2>
    
    <p><strong>Angular</strong> és un framework modern amb <em>components</em> reutilitzables.</p>

    {% include info_box.html
       contingut="<strong>Definició:</strong> Un framework proporciona <code>estructura completa</code>."
    %}

    <h3>Característiques</h3>

    <ul>
        <li><strong>TypeScript:</strong> Tipatge fort</li>
        <li><strong>Components:</strong> Reutilitzables</li>
    </ul>

    {% include code-block.html
       lang="bash"
       code="npm install -g @angular/cli
ng version"
    %}

    {% include warning_box.html
       contingut="<strong>Important:</strong> Necessites Node.js v18+"
    %}
    
    {% include checklist.html
       titol="Instal·lació de Node.js"
       elements="Descarregar Node.js LTS des de nodejs.org|Executar l'instal·lador seguint les instruccions|Verificar la instal·lació amb node --version|Verificar npm amb npm --version"
    %}
</div>

<div class="section">
    <h2 id="Unitat1_Bloc1_Seccio2">Configuració</h2>
    
    <p>Contingut de la segona secció amb <strong>HTML</strong> directe...</p>
    
    {% include success_box.html
       contingut="<strong>Completat:</strong> 
<ul>
<li>Entorn configurat</li>
<li>CLI instal·lat</li>
</ul>"
    %}
</div>
```

## Ajuda

**Dubtes sobre contingut:** Contacta l'equip educatiu  
**Problemes tècnics:** Contacta l'equip tècnic  
**Errors de sintaxi:** Revisa aquesta guia

---

## Reutilitzar Aquest Sistema per Altres Mòduls

**Per professors que vulguin adaptar aquest sistema per crear nous cursos IOC:**

### Només cal canviar 3 variables al `_config.yml`:

```yaml
# 1. Canviar el cicle i mòdul
cicle_modulo: "VOSTRE_CICLE_MODULO"    # Ex: "SMX_UF1", "DAW_M7", etc.

# 2. Canviar el títol del curs
module_title: "TÍTOL DEL VOSTRE CURS"  # Ex: "Sistemes Operatius Linux"

# 3. Canviar l'autor
authors: 
  - "EL VOSTRE NOM"                     # Pot haver-hi múltiples autors
```

**Això és tot!** El sistema mostrarà automàticament:
- El vostre cicle/mòdul entre claudàtors `[VOSTRE_CICLE_MODULO]`
- El títol del vostre curs a totes les pàgines
- El vostre nom com a autor
- `Institut Obert de Catalunya` com a organització

**Sistema 100% portable** - Funciona en qualsevol URL de GitHub Pages  
**Migració completa** - Tot el contingut es transfereix automàticament  
**Configuració mínima** - Només 3 variables per personalitzar

---
**Recorda:** Només HTML + Components Jekyll. NO Markdown. NO CSS personalitzat.

## Problemes comuns

- No apareixen seccions al Quadern: afegeix `id` als `h2` amb el format jeràrquic i defineix les `seccions` al `_config.yml`.
- El bloc no surt al llistat de la unitat: comprova la `url` del bloc al `_config.yml` i que existeix `bloc-<M>/index.html`.
- El codi es veu sense format: usa `{% include code-block.html %}` en comptes de `<pre><code>` manual.
- Hi ha emojis icònics: elimina'ls; l’estil del curs no els necessita.

## Checklist de publicació

- Front matter complet i coherent (`layout`, `title`, `unitat`, `bloc`).
- `descripcio.html` creat per unitats i blocs (3–6 punts clau).
- Totes les seccions principals amb `h2` + `id` únic jeràrquic.
- Components Jekyll emprats en lloc de HTML personalitzat per avisos, codi, etc.
- Enllaços interns revisats i sense emojis.
