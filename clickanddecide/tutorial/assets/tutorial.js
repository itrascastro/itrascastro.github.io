/* ---------------------------------------------------------------------------
   Click & Decide — Guia d'aprenentatge

   Tres comportaments, tots opcionals: si el JavaScript no s'executa, la pàgina
   continua sent llegible i navegable.

     1. L'índex lateral marca l'apartat que s'està llegint.
     2. Les fletxes del teclat porten a la unitat anterior o següent.
     3. Les figures s'obren a pantalla completa.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* Únic lloc on viu l'ordre del curs. La navegació mínima (anterior, següent
     i tornada a l'índex) és HTML estàtic: aquesta llista només hi afegeix el
     desplegable per saltar a qualsevol unitat. */
  var UNITS = [
    'El model de dades: les quatre taules',
    'Accés a l\'aplicació Builder',
    'Entrada a l\'aplicació web i perfils d\'usuari',
    'Projectes i objectes: consultes, informes i cubs',
    'Creació bàsica d\'una consulta',
    'Ordenació dels resultats',
    'Criteris de selecció i operadors',
    'La taula de persones i la lògica AND / OR',
    'La taula de llocs i l\'estat de plantilla',
    'Tipus de pressupost, llocs ocupats i reservats',
    'Agrupacions, recomptes i agregats',
    'Consultes de registres únics',
    'Titulacions: les taules de registres múltiples',
    'Incidències: WAIV9060 i WAIV9061',
    'Històric persona-lloc: WAIV9030 i WAIV9031',
    'Exportació de la informació',
    'Paràmetres de text i numèrics',
    'Paràmetres de data',
    'Síntesi, errors freqüents i bones pràctiques'
  ];

  /* Ubicacio del simulador, relativa a una unitat. Cada exercici hi afegeix
     el seu codi -index.html#ex=EX-06-2- i el simulador n'obre un d'aquella
     unitat. En publicar, la carpeta es diu nomes "simulador". */
  var SIMULADOR = '../../../simulador/index.html';

  var lightbox = createLightbox();

  linkExercises();
  buildUnitPicker();
  highlightCurrentSection();
  enableUnitPicker();
  enableArrowNavigation();
  buildBackToTop();

  /* --- Tornada a dalt ----------------------------------------------------- */

  function buildBackToTop() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'to-top';
    button.setAttribute('aria-label', 'Torna a dalt');
    button.title = 'Torna a dalt';
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(button);

    button.addEventListener('click', function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      document.querySelector('.wordmark').focus({ preventScroll: true });
    });

    /* Només apareix quan ja s'ha baixat prou perquè tingui sentit. */
    onScroll(function () {
      button.classList.toggle('is-visible', window.scrollY > 600);
    });
  }

  /* --- Enllac de cada exercici amb el simulador --------------------------- */

  function linkExercises() {
    if (!SIMULADOR) return;

    var separator = SIMULADOR.indexOf('#') === -1 ? '#' : '&';

    Array.prototype.forEach.call(
      document.querySelectorAll('.exercici'),
      function (exercise) {
        var code = exercise.querySelector('.codi');
        if (!code) return;

        var link = document.createElement('a');
        link.className = 'obre-simulador';
        link.href = SIMULADOR + separator + 'ex=' + encodeURIComponent(code.textContent.trim());
        link.textContent = "Obre'l al simulador";
        link.rel = 'noopener';
        exercise.querySelector('header').appendChild(link);
      }
    );
  }

  /* --- Construcció del desplegable --------------------------------------- */

  function buildUnitPicker() {
    var slot = document.querySelector('[data-unit-picker]');
    if (!slot) return;

    var current = document.documentElement.dataset.unit;
    var root = document.documentElement.dataset.root || '.';

    var details = document.createElement('details');
    details.className = 'unit-picker';

    var summary = document.createElement('summary');
    summary.textContent = 'Unitats';
    details.appendChild(summary);

    var panel = document.createElement('div');
    panel.className = 'unit-picker-panel';

    var list = document.createElement('ol');
    /* La unitat 0 és la de fonaments; les 18 restants segueixen la sèrie oficial. */
    UNITS.forEach(function (title, number) {
      var padded = number < 10 ? '0' + number : String(number);

      var link = document.createElement('a');
      link.href = root + '/unitats/' + padded + '/';
      link.innerHTML = '<span class="n">' + padded + '</span><span class="t"></span>';
      link.querySelector('.t').textContent = title;
      if (padded === current) link.setAttribute('aria-current', 'page');

      var item = document.createElement('li');
      item.appendChild(link);
      list.appendChild(item);
    });

    panel.appendChild(list);
    details.appendChild(panel);
    slot.appendChild(details);
  }

  /* --- Índex lateral ----------------------------------------------------- */

  function highlightCurrentSection() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.sidebar a[href^="#"]')
    );
    if (!links.length) return;

    var entries = [];
    links.forEach(function (link) {
      var section = document.getElementById(link.hash.slice(1));
      if (section) entries.push({ link: link, section: section });
    });
    if (!entries.length) return;

    /* Mentre dura el desplaçament suau d'un clic, mana el que s'ha clicat. */
    var fixat = null;
    var rellotge = null;

    /* L'apartat actiu és l'últim el títol del qual ha passat per sota de la
       capçalera: el que s'acaba de començar a llegir. Abans es triava el que
       ocupava més superfície de la finestra, i amb un apartat curt seguit d'un
       de llarg -que és el cas de la pàgina de crèdits- el senyalador saltava
       al següent abans d'hora. */
    function update() {
      var header = document.querySelector('.masthead');
      var line = (header ? header.getBoundingClientRect().height : 0) + 24;

      var best = entries[0];
      entries.forEach(function (entry) {
        if (entry.section.getBoundingClientRect().top <= line) best = entry;
      });

      /* Al final de tot, l'últim apartat: si no, el penúltim es queda marcat
         perquè l'últim no arriba mai a creuar la línia. */
      var fons = window.scrollY + window.innerHeight;
      if (fons >= document.documentElement.scrollHeight - 4) {
        best = entries[entries.length - 1];
      }

      entries.forEach(function (entry) {
        entry.link.classList.toggle('is-current', entry === best);
      });
    }

    /* En clicar un enllaç de l'index, aquell apartat queda marcat de seguida.
       Sense aixo, als ultims apartats d'una pagina curta la pagina ja no pot
       baixar mes, el senyalador es queda a l'ultim i sembla que l'enllaç no
       funcioni. */
    entries.forEach(function (entry) {
      entry.link.addEventListener('click', function () {
        entries.forEach(function (altre) {
          altre.link.classList.toggle('is-current', altre === entry);
        });
        fixat = entry;
        clearTimeout(rellotge);
        rellotge = setTimeout(function () { fixat = null; }, 900);
      });
    });

    onScroll(function () { if (!fixat) update(); });
  }

  /* Un únic bucle de scroll per a tots els comportaments que en depenen. */
  function onScroll(callback) {
    var ticking = false;

    function run() {
      ticking = false;
      callback();
    }

    function schedule() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(run);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    callback();
  }

  /* --- Desplegable amb les divuit unitats -------------------------------- */

  function enableUnitPicker() {
    var picker = document.querySelector('.unit-picker');
    if (!picker) return;

    document.addEventListener('click', function (event) {
      if (picker.open && !picker.contains(event.target)) picker.open = false;
    });
    picker.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { picker.open = false; picker.querySelector('summary').focus(); }
    });
  }

  /* --- Fletxes del teclat ------------------------------------------------ */

  function enableArrowNavigation() {
    document.addEventListener('keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (lightbox.isOpen()) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;

      var rel = event.key === 'ArrowLeft' ? 'prev'
              : event.key === 'ArrowRight' ? 'next'
              : null;
      if (!rel) return;

      var target = document.querySelector('link[rel="' + rel + '"]');
      if (target && target.href) window.location.href = target.href;
    });
  }

  /* --- Visor d'imatges --------------------------------------------------- */

  function createLightbox() {
    var figures = Array.prototype.slice.call(
      document.querySelectorAll('figure img')
    );
    if (!figures.length) return { isOpen: function () { return false; } };

    var index = 0;
    var zoomed = false;
    var lastFocus = null;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Imatge ampliada');
    overlay.innerHTML =
      '<button class="lb-close" type="button" aria-label="Tanca">&times;</button>' +
      '<button class="lb-step lb-prev" type="button" aria-label="Imatge anterior">&#8249;</button>' +
      '<button class="lb-step lb-next" type="button" aria-label="Imatge següent">&#8250;</button>' +
      '<figure class="lb-stage"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(overlay);

    var stage = overlay.querySelector('.lb-stage');
    var image = overlay.querySelector('.lb-stage img');
    var caption = overlay.querySelector('.lb-stage figcaption');
    var prevButton = overlay.querySelector('.lb-prev');
    var nextButton = overlay.querySelector('.lb-next');

    figures.forEach(function (img, position) {
      img.classList.add('is-zoomable');
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.title = 'Fes clic per veure la imatge en gran';
      img.addEventListener('click', function () { open(position); });
      img.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(position);
        }
      });
    });

    overlay.querySelector('.lb-close').addEventListener('click', close);
    prevButton.addEventListener('click', function () { show(index - 1); });
    nextButton.addEventListener('click', function () { show(index + 1); });

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay || event.target === stage) close();
    });

    image.addEventListener('click', function () {
      zoomed = !zoomed;
      overlay.classList.toggle('is-zoomed', zoomed);
    });

    document.addEventListener('keydown', function (event) {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { close(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    });

    function open(position) {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('has-lightbox');
      show(position);
      overlay.querySelector('.lb-close').focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('has-lightbox');
      zoomed = false;
      overlay.classList.remove('is-zoomed');
      if (lastFocus) lastFocus.focus();
    }

    function show(position) {
      index = (position + figures.length) % figures.length;
      zoomed = false;
      overlay.classList.remove('is-zoomed');

      var source = figures[index];
      var text = source.closest('figure').querySelector('figcaption');

      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = text ? text.textContent.trim() : '';
      caption.hidden = !caption.textContent;

      var many = figures.length > 1;
      prevButton.hidden = !many;
      nextButton.hidden = !many;
    }

    return { isOpen: function () { return !overlay.hidden; } };
  }
})();
