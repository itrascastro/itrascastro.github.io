# Prompts d'imatges per a la Unitat 0

Aquest document conté els prompts per generar les infografies que falten als blocs 3 i 4.

## Criteris comuns per a totes les imatges

Aplica aquests criteris a tots els prompts:

- estil d'infografia educativa moderna, clara i consistent amb la resta de materials de DAM_0488;
- composició horitzontal, pensada per inserir-se en una pàgina web;
- colors suaus amb blau, violeta i blanc, contrast suficient i aspecte professional;
- il·lustracions vectorials netes, sense fotografies ni marques comercials;
- tipografia gran, llegible i sense text petit decoratiu;
- etiquetes en català només quan siguin imprescindibles;
- no incloure anys, dates, números de versió ni noms de productes comercials concrets;
- no incloure credencials, contrasenyes, dades personals ni adreces reals;
- no afegir logotips de Microsoft, PostgreSQL, Visual Studio ni cap altra marca;
- evitar pantalles plenes de text: la imatge ha d'explicar relacions i fluxos, no substituir el material escrit;
- no utilitzar fletxes amb direccions ambigües ni elements tallats pels marges;
- deixar marge exterior suficient per poder retallar la imatge sense perdre informació.

---

## Bloc 3 — Persistència i organització de l'aplicació

### Bloc 3, secció 2 — Instal·lar i preparar PostgreSQL

**Nom de fitxer suggerit:** `13-postgresql-entorn-local.png`

**Prompt:**

> Crea una infografia educativa horitzontal que expliqui un entorn local de PostgreSQL per a una aplicació Windows Forms. Mostra tres peces relacionades: un servidor de base de dades local, una eina gràfica d'administració i un client de terminal. Afegeix una quarta peça, l'aplicació de catàleg, connectada només al servidor. Representa visualment que l'aplicació consulta una base de dades de pràctiques i que les credencials es mantenen fora del codi. Inclou un petit esquema de connexió amb host local, port, base de dades i usuari, però sense mostrar cap contrasenya ni cap valor real. La composició ha de deixar clar que l'eina gràfica i el client de terminal són formes diferents d'administrar el mateix servidor, no tres bases de dades diferents. Estil d'infografia vectorial educativa, neta, moderna, colors blau i violeta, etiquetes molt breus en català i sense text petit.

### Bloc 3, secció 3 — Persistència real amb PostgreSQL

**Nom de fitxer suggerit:** `14-postgresql-taula-repositori.png`

**Prompt:**

> Crea una infografia educativa horitzontal sobre el recorregut entre un objecte Producte, un repositori i una taula PostgreSQL. A l'esquerra mostra un objecte amb les propietats Id, Nom, Preu i Unitats. Al centre mostra un repositori que tradueix l'objecte a consultes parametritzades. A la dreta mostra una taula amb una clau primària i restriccions que impedeixen preus i unitats negatives. Utilitza fletxes bidireccionals per representar lectura i escriptura, però deixa clar que la interfície no parla directament amb la taula. Inclou una petita indicació visual que els paràmetres separen les dades del text SQL. No incloguis cap contrasenya, URL, versió ni marca comercial. Estil de diagrama vectorial clar, jerarquia visual forta, colors blau, violeta, blanc i taronja per a les restriccions.

### Bloc 3, secció 5 — Errors habituals i recuperació

**Nom de fitxer suggerit:** `15-errors-persistencia-recuperacio.png`

**Prompt:**

> Crea una infografia educativa horitzontal que mostri tres incidències d'un catàleg d'escriptori i la resposta segura a cadascuna. Primer cas: fitxer JSON inexistent en el primer arrencada, que es pot iniciar buit. Segon cas: fitxer JSON corrupte, que s'ha de conservar i notificar, sense substituir-lo silenciosament per una llista buida. Tercer cas: servidor PostgreSQL no disponible, que ha de mostrar un error comprensible i no afirmar que l'operació s'ha completat. Afegeix una columna final amb el flux de recuperació: aturar, conservar l'estat, identificar la causa, corregir i verificar. No mostris pantalles amb text llarg ni dades reals. Estil d'infografia vectorial educativa, amb símbols d'alerta i recuperació, colors ambre, vermell suau, verd i blau, etiquetes breus en català.

> La secció 1 ja utilitza la infografia existent de filtres i CSV. La secció 4 ja utilitza la infografia existent d'execució i depuració.

---

## Bloc 4 — Projecte integrador Windows Forms

### Bloc 4, secció 1 — Enunciat i arquitectura del gestor de productes

**Nom de fitxer suggerit:** `16-arquitectura-gestor-productes.png`

**Prompt:**

> Crea una infografia educativa horitzontal de l'arquitectura d'un petit gestor de productes Windows Forms. Mostra dues finestres a l'esquerra: finestra principal amb graella i finestra d'edició. Al centre mostra el model Producte i una capa d'aplicació. A la dreta mostra un repositori i PostgreSQL. Les fletxes han d'indicar que les finestres treballen amb el model i el repositori, però no amb SQL ni amb la cadena de connexió. Inclou una zona visual separada per a validació i errors. La imatge ha de transmetre separació de responsabilitats i una aplicació petita però completa. Etiquetes molt breus en català, sense versions, dates, logotips ni credencials.

### Bloc 4, secció 2 — Crear la solució i el model Producte

**Nom de fitxer suggerit:** `17-model-producte-classes-propietats.png`

**Prompt:**

> Crea una infografia educativa horitzontal que expliqui com una classe Producte representa una fila de dades. Mostra una classe amb les propietats Id, Nom, Preu i Unitats, i al costat dues instàncies diferents amb valors d'exemple genèrics. Afegeix una zona inferior amb les tres regles de validació: nom obligatori, preu no negatiu i unitats no negatives. Representa visualment que el mateix model és utilitzat per la interfície i pel repositori. No incloguis codi llarg, només una representació de classe i objectes. Estil vectorial net, etiquetes grans en català, sense anys ni versions.

### Bloc 4, secció 3 — Preparar PostgreSQL i el repositori CRUD

**Nom de fitxer suggerit:** `18-repositori-crud-postgresql.png`

**Prompt:**

> Crea una infografia educativa horitzontal que expliqui un repositori CRUD entre una aplicació i PostgreSQL. Mostra quatre operacions separades i fàcils de reconèixer: crear, consultar, modificar i eliminar. Cada operació ha de passar pel repositori i arribar a una taula productes amb Id, Nom, Preu i Unitats. Inclou un símbol visual per a les consultes parametritzades i un escut per a les restriccions de la taula. Mostra també una clau de configuració local separada de l'aplicació, sense cap valor de contrasenya. No incloguis SQL llarg, números de versió ni marques. Estil d'infografia vectorial moderna, colors blau i violeta amb accents verds i vermells per a les operacions.

### Bloc 4, secció 4 — Crear la finestra principal i carregar el catàleg

**Nom de fitxer suggerit:** `19-finestra-principal-datagridview.png`

**Prompt:**

> Crea una infografia educativa horitzontal sobre la finestra principal d'un gestor de productes. Mostra una finestra amb una graella de productes, una barra superior amb botons «Nou», «Editar» i «Eliminar», i una etiqueta inferior d'estat. Al costat, mostra el flux d'obertura: la finestra demana dades al repositori, el repositori consulta PostgreSQL i la graella rep una col·lecció de productes. Utilitza una lupa o una indicació visual per explicar que la graella només presenta dades i no conté SQL. No intentis reproduir una captura de pantalla real; fes una maqueta vectorial simplificada amb text gran i llegible en català, sense marques ni versions.

### Bloc 4, secció 5 — Crear la finestra d'edició i validar dades

**Nom de fitxer suggerit:** `20-finestra-editor-validacio.png`

**Prompt:**

> Crea una infografia educativa horitzontal que mostri una finestra modal d'edició d'un producte. Inclou camps per a nom, preu i unitats, i dos botons: acceptar i cancel·lar. A la dreta mostra el flux de validació: convertir els valors, validar el model, retornar un producte si és correcte o mostrar errors si no ho és. Representa clarament que cancel·lar no modifica ni la graella ni la base de dades. Utilitza exemples neutres, sense dades personals, sense contrasenyes i sense textos petits. Estil vectorial net, colors blau, verd per a l'acceptació i ambre per als avisos, etiquetes breus en català.

### Bloc 4, secció 6 — Connectar el CRUD amb les finestres

**Nom de fitxer suggerit:** `21-flux-crud-finestra-repositori.png`

**Prompt:**

> Crea una infografia educativa horitzontal amb tres fluxos independents d'una finestra Windows Forms cap a un repositori PostgreSQL: alta, edició i eliminació. En l'alta, mostra obrir el diàleg, validar, inserir i recarregar. En l'edició, mostra seleccionar una fila, conservar l'identificador, actualitzar i recarregar. En l'eliminació, mostra seleccionar, demanar confirmació, eliminar i recarregar. Utilitza una paleta que diferenciï lectures, escriptures i eliminació destructiva, però sense alarmisme. No incloguis SQL llarg ni text petit. Etiquetes molt breus en català i fletxes amb un ordre clar.

### Bloc 4, secció 7 — Cercar i filtrar el catàleg

**Nom de fitxer suggerit:** `22-cerca-i-filtres-cataleg.png`

**Prompt:**

> Crea una infografia educativa horitzontal sobre el filtratge d'una col·lecció de productes en memòria. A l'esquerra mostra la col·lecció completa. Al centre mostra dos criteris: text de cerca pel nom i casella «Només amb existències». A la dreta mostra la llista visible després d'aplicar els criteris. Inclou una indicació visual que la col·lecció original no es modifica i que no es fa una consulta a PostgreSQL per cada tecla. Estil de diagrama vectorial, colors blau i violeta, una lupa i una casella de selecció, etiquetes grans en català, sense dates ni versions.

### Bloc 4, secció 8 — Depurar i verificar el projecte complet

**Nom de fitxer suggerit:** `23-depuracio-punts-verificacio.png`

**Prompt:**

> Crea una infografia educativa horitzontal que segueixi una alta de producte des del formulari fins a PostgreSQL i de tornada a la graella. Marca quatre punts de verificació amb icones de depurador: valors del formulari, model validat, repositori i resultat retornat. Afegeix una segona franja amb els casos de prova: arrencada, alta, edició, eliminació, validació incorrecta, reinici i servidor aturat. La imatge ha de diferenciar el recorregut normal i el camí d'error, sense mostrar codi llarg ni secrets. Estil vectorial educatiu, molt ordenat, etiquetes breus en català.

### Bloc 4, secció 9 — Tests unitaris del model i dels filtres

**Nom de fitxer suggerit:** `24-tests-unitaris-arrange-act-assert.png`

**Prompt:**

> Crea una infografia educativa horitzontal i molt senzilla per explicar un test unitari amb el patró Preparar, Actuar i Comprovar. A l'esquerra mostra unes dades de prova d'un Producte. Al centre mostra la crida a Validate o a ProducteFilter. A la dreta mostra una comprovació amb resultat correcte o fallada. Afegeix una zona inferior que indiqui que el test unitari no necessita Windows Forms, PostgreSQL ni Internet. Inclou dos mini casos: producte vàlid i producte amb preu negatiu. Estil amable i clar per a principiants, colors blau, verd i vermell suau, text gran en català, sense codi llarg ni marques.

### Bloc 4, secció 10 — Integració final i documentació

**Nom de fitxer suggerit:** `25-projecte-complet-checklist.png`

**Prompt:**

> Crea una infografia educativa horitzontal de tancament que mostri el gestor de productes complet com un circuit verificat. Inclou les peces: dues finestres, model Producte, repositori, PostgreSQL, CRUD, filtres, depuració i tests unitaris. Afegeix una checklist visual amb indicadors verds per a «compila», «carrega dades», «valida», «crea», «edita», «elimina», «filtra», «gestiona errors» i «passa els tests». Ha de quedar clar que és una guia de verificació i estudi, no una tasca d'entrega. Estil vectorial modern, composició neta, etiquetes breus en català, sense logotips, versions, dates ni credencials.

---

## Imatges existents que no cal regenerar

- Bloc 3, secció 1: `11-filtres-csv.png` ja cobreix la relació entre filtre i exportació.
- Bloc 3, secció 4: `13-executar-depurar-visual-studio.png` ja cobreix l'execució i la depuració.
- Les imatges originals de variables, classes, formularis, CRUD i DataGridView continuen sent reutilitzables quan una secció ja les utilitza i no cal duplicar-les sense una diferència pedagògica clara.
