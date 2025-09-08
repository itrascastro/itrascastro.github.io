/* Quadern Rich Editor integration (scoped, no mixing with existing app code)
   Based on dev-resources/rich-12.html. Creates Quill editor instances that
   sync to a hidden textarea indicated by data-sync-target. */
;(function(){
  'use strict';

  function uid(){ return 'qre-' + Math.random().toString(36).slice(2,8) + Date.now().toString(36); }
  function $(root, sel){ return (root || document).querySelector(sel); }
  function on(el, ev, fn){ if (el) el.addEventListener(ev, fn); }

  function sanitizeHTML(html){
    if (typeof DOMPurify === 'undefined') return html;
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      KEEP_CONTENT: true,
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow','allowfullscreen','frameborder','loading','referrerpolicy','sandbox']
    });
  }

  function ensureDeps(){
    if (typeof Quill === 'undefined') { console.error('Quill missing'); return false; }
    if (typeof hljs === 'undefined') { console.warn('highlight.js missing'); }
    return true;
  }

  function buildMarkup(container, ids){
    const noTheme = container.hasAttribute('data-no-theme');
    const statusLeft = container.hasAttribute('data-status-left');
    const headHtml = statusLeft
      ? [
        '  <div class="head">',
        '    <div class="status" data-qre-status aria-live="polite"></div>',
        '    <div class="fields" data-qre-slot="fields"></div>',
        '    <div class="actions" aria-label="Accions">',
        `      <button class="iconbtn" id="${ids.btnHTML}" title="Veure/editar HTML">&lt;/&gt;</button>`,
        `      <button class="iconbtn" id="${ids.btnExpand}" title="Editar en gran">⤢</button>`,
        '    </div>',
        (noTheme ? '' : [
        '    <div class="theme-toggle">',
        '      <label for="'+ids.themeSel+'">Tema</label>',
        `      <select id="${ids.themeSel}" class="input" style="width:auto;padding:6px 8px;">`,
        '        <option value="light">Clar</option>',
        '        <option value="dark">Fosc</option>',
        '      </select>',
        '    </div>'
        ].join('')),
        '  </div>'
      ].join('')
      : [
        '  <div class="head">',
        '    <div class="fields" data-qre-slot="fields"></div>',
        '    <div class="actions" aria-label="Accions">',
        '      <div class="status" data-qre-status aria-live="polite"></div>',
        `      <button class="iconbtn" id="${ids.btnHTML}" title="Veure/editar HTML">&lt;/&gt;</button>`,
        `      <button class="iconbtn" id="${ids.btnExpand}" title="Editar en gran">⤢</button>`,
        '    </div>',
        (noTheme ? '' : [
      '    <div class="theme-toggle">',
      '      <label for="'+ids.themeSel+'">Tema</label>',
      `      <select id="${ids.themeSel}" class="input" style="width:auto;padding:6px 8px;">`,
      '        <option value="light">Clar</option>',
      '        <option value="dark">Fosc</option>',
      '      </select>',
      '    </div>'
      ].join('')),
        '  </div>'
      ].join('');
    const html = [
      '<div class="panel">',
      headHtml,
      '  <div class="editor">',
        `    <div id="${ids.toolbarCompact}" class="ql-toolbar ql-snow">`,
      '      <span class="ql-formats">',
      '        <select class="ql-header"><option selected></option><option value="1">H1</option><option value="2">H2</option><option value="3">H3</option><option value="4">H4</option><option value="5">H5</option><option value="6">H6</option></select>',
      '        <button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button>',
      '      </span>',
      '      <span class="ql-formats">',
      '        <button class="ql-list" value="bullet"></button><button class="ql-list" value="ordered"></button><button class="ql-link"></button><button class="ql-code-block"></button><button class="ql-clean"></button>',
      '        <select class="ql-color"></select><select class="ql-background"></select>',
      '      </span>',
      '    </div>',
      `    <div id="${ids.editor}"></div>`,
      '  </div>',
      '</div>',
      `
      <dialog id="${ids.modalBig}" class="c-modal">
        <div class="m-head">
          <div class="m-title"></div>
          <div id="${ids.toolbarFull}" class="ql-toolbar ql-snow">
            <span class="ql-formats">
              <select class="ql-header">
                <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
                <option value="4">H4</option><option value="5">H5</option><option value="6">H6</option>
                <option selected></option>
              </select>
              <select class="ql-font"></select><select class="ql-size"></select>
            </span>
            <span class="ql-formats">
              <button class="ql-bold"></button><button class="ql-italic"></button>
              <button class="ql-underline"></button><button class="ql-strike"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-list" value="ordered"></button>
              <button class="ql-list" value="bullet"></button>
              <button class="ql-indent" value="-1"></button>
              <button class="ql-indent" value="+1"></button>
              <select class="ql-align"></select>
            </span>
            <span class="ql-formats">
              <button class="ql-blockquote"></button><button class="ql-code-block"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-link"></button><button class="ql-image"></button><button class="ql-video"></button>
            </span>
            <span class="ql-formats">
              <select class="ql-color"></select><select class="ql-background"></select>
            </span>
          </div>
          <div class="m-actions"><button class="iconbtn" id="${ids.btnCloseBig}" title="Tancar">✕</button></div>
        </div>
        <div class="m-body" id="${ids.modalBody}"><div id="${ids.modalEditor}"></div></div>
      </dialog>
      `,
      `
      <dialog id="${ids.modalHTML}" class="c-modal">
        <div class="m-head">
          <div class="m-title">HTML</div>
          <div class="m-actions">
            <button class="iconbtn" id="${ids.btnCopyHTML}" title="Copia">⧉</button>
            <button class="iconbtn" id="${ids.btnApplyHTML}" title="Aplicar">✓</button>
            <button class="iconbtn" id="${ids.btnCloseHTML}" title="Tancar">✕</button>
          </div>
        </div>
        <div class="m-body">
          <textarea id="${ids.htmlEditor}" class="codebox" spellcheck="false"></textarea>
          <div class="code-actions"><small style="color:var(--muted)">Edita el HTML i fes clic a ✓ per aplicar-lo.</small></div>
        </div>
      </dialog>
      `
    ].join('');
    container.innerHTML = html;
  }

  function createValueBridge(target, apply){
    const proto = HTMLTextAreaElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    let fromQuill = false;
    try {
      Object.defineProperty(target, 'value', {
        set: function(v){
          desc.set.call(this, v);
          if (!fromQuill) apply(v);
        },
        get: function(){ return desc.get.call(this); }
      });
    } catch(e){ /* ignore */ }
    return {
      setFromQuill(v){ fromQuill = true; try { target.value = v; } finally { fromQuill = false; } },
      setRaw(v){ desc.set.call(target, v); }
    };
  }

  function attach(container){
    if (!ensureDeps()) return null;
    const syncSel = container.getAttribute('data-sync-target');
    const target = document.querySelector(syncSel);
    if (!target) { console.error('RichEditor: sync target not found', syncSel); return null; }

    // Theme
    (function initTheme(){
      const followApp = container.hasAttribute('data-no-theme');
      const set = function(mode){ container.setAttribute('data-theme', mode); try{ localStorage.setItem('notes_theme', mode); }catch(e){}
        const hlLight = document.getElementById('hljs-light'); const hlDark = document.getElementById('hljs-dark'); if (hlLight && hlDark){ hlDark.disabled = mode !== 'dark'; hlLight.disabled = mode === 'dark'; }
      };
      if (followApp){
        const readMode = () => {
          const body = document.body;
          const mode = (body.getAttribute('data-theme') === 'dark' || body.classList.contains('dark-theme')) ? 'dark' : 'light';
          set(mode);
        };
        readMode();
        try{
          const obs = new MutationObserver(readMode);
          obs.observe(document.body, { attributes:true, attributeFilter:['data-theme','class'] });
        }catch(e){}
      } else {
        const saved = (function(){ try { return localStorage.getItem('notes_theme'); } catch(e){ return null; } })();
        set(saved || 'light');
      }
    })();

    const ids = {
      toolbarCompact: uid(), editor: uid(), modalBig: uid(), toolbarFull: uid(), modalBody: uid(), modalEditor: uid(), btnExpand: uid(), btnCloseBig: uid(), modalHTML: uid(), btnHTML: uid(), btnCloseHTML: uid(), btnCopyHTML: uid(), btnApplyHTML: uid(), htmlEditor: uid(), themeSel: uid()
    };
    // Since we need the buttons in head, reuse btn ids there
    ids.btnExpand = ids.btnExpand; ids.btnHTML = ids.btnHTML; ids.btnCloseBig = ids.btnCloseBig;

    buildMarkup(container, ids);

    const themeSel = $(container, '#'+ids.themeSel);
    if (themeSel) {
      const setTheme = function(mode){
        container.setAttribute('data-theme', mode);
        try{ localStorage.setItem('notes_theme', mode); }catch(e){}
        const hlLight = document.getElementById('hljs-light');
        const hlDark = document.getElementById('hljs-dark');
        if (hlLight && hlDark){ hlDark.disabled = mode !== 'dark'; hlLight.disabled = mode === 'dark'; }
      };
      on(themeSel, 'change', function(e){ setTheme(e.target.value); });
      themeSel.value = container.getAttribute('data-theme') || 'light';
    }

    // Adopt external field nodes into header slot (if requested)
    const adoptSel = container.getAttribute('data-adopt-fields');
    const slot = $(container, '[data-qre-slot="fields"]');
    if (adoptSel && slot){
      adoptSel.split(',').map(s=>s.trim()).filter(Boolean).forEach(function(sel){
        const node = document.querySelector(sel);
        if (node){
          // Ensure visual consistency
          node.classList.add('input');
          slot.appendChild(node);
        }
      });
    }

    // Full toolbar inline: if requested, move full toolbar from modal to inline and hide expand
    const wantFull = container.hasAttribute('data-full-toolbar');
    if (wantFull) {
      try {
        const modalFull = $(container, '#'+ids.toolbarFull);
        const editorHost = $(container, '#'+ids.editor);
        if (modalFull && editorHost) {
          // Insert full toolbar before editor and remove compact toolbar
          editorHost.parentNode.insertBefore(modalFull, editorHost);
          const compact = $(container, '#'+ids.toolbarCompact);
          if (compact) compact.remove();
        }
        const btnExpandEl = $(container, '#'+ids.btnExpand);
        if (btnExpandEl) btnExpandEl.style.display = 'none';
        const modalBigEl = $(container, '#'+ids.modalBig);
        if (modalBigEl) modalBigEl.remove();
      } catch(e){}
    }

    const toolbarId = wantFull ? ids.toolbarFull : ids.toolbarCompact;

    // Init Quill (embedded)
    const quill = new Quill('#'+ids.editor, {
      theme:'snow',
      placeholder:'Escriu la teva nota…',
      modules:{
        toolbar:{ container:'#'+toolbarId,
          handlers:{
            'code-block': function(){
              var r = this.quill.getSelection(true);
              var f = this.quill.getFormat(r);
              if (f['code-block']){
                this.quill.format('code-block', false);
                this.quill.insertText(r.index, '\n', Quill.sources.USER);
                this.quill.setSelection(r.index+1, 0, Quill.sources.SILENT);
              } else {
                this.quill.format('code-block', true);
              }
            }
          }
        },
        syntax: (typeof hljs !== 'undefined') ? { highlight:function(t){ return hljs.highlightAuto(t).value; } } : undefined
      }
    });

    // Facilitar focus en clicar zones buides del contenidor
    const qContainer = container.querySelector('#'+ids.editor+' + .ql-container, #'+ids.editor+' ~ .ql-container') || container.querySelector('.ql-container');
    if (qContainer) {
      qContainer.addEventListener('mousedown', function(e){
        // Si es clica directament el contenidor (fora de .ql-editor), focus al quill
        if (e.target.classList.contains('ql-container')) {
          quill.focus();
          try { quill.setSelection(quill.getLength(), 0, 'silent'); } catch {}
        }
      });
    }

    // Bridge between target.value and Quill contents (avoids recursion)
    const bridge = createValueBridge(target, function(v){
      const sanitized = sanitizeHTML(v||'');
      quill.setText('');
      quill.clipboard.dangerouslyPasteHTML(0, sanitized, 'api');
    });

    // Sync Quill -> target, only for user edits to avoid autosave on programmatic loads
    quill.on('text-change', function(delta, oldDelta, source){
      if (source !== 'user') return;
      const html = quill.root.innerHTML.trim();
      bridge.setFromQuill(html);
      target.dispatchEvent(new Event('input', { bubbles:true }));
    });

    // Paste handling: preserve indentation for code
    quill.root.addEventListener('paste', function(e){
      if (!e.clipboardData) return;
      e.preventDefault();
      var html = e.clipboardData.getData('text/html') || '';
      var text = e.clipboardData.getData('text/plain') || '';
      var sel = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      var fmt = quill.getFormat(sel);

      // Heuristics: treat as code if already in code-block or clipboard looks like code
      var looksLikeCode = /<pre|<code|```/.test(html) || /\t|^\s{2,}/m.test(text);
      var inCode = !!fmt['code-block'];

      if (inCode || looksLikeCode) {
        // Get plain text content and normalize newlines and tabs
        var plain = text;
        if (!plain && html){
          try { var tmp = document.createElement('div'); tmp.innerHTML = html; plain = (tmp.innerText || tmp.textContent || '').replace(/\r\n?|\r/g,'\n'); } catch(_){}
        }
        plain = (plain || '').replace(/\r\n?|\r/g,'\n').replace(/\t/g,'    ');

        // Ensure we're in code-block to preserve whitespace visually
        if (!inCode) quill.format('code-block', true);
        quill.insertText(sel.index, plain, 'user');
        return;
      }

      // Default: sanitize HTML and paste, preserving line breaks via HTML
      var source = html || (text ? text.replace(/\n/g,'<br>') : '');
      var clean = sanitizeHTML(source);
      quill.clipboard.dangerouslyPasteHTML(sel.index, clean, 'user');
    });

    // Initialize from target current value
    (function initFromTarget(){
      var initial = target.value || '';
      if (initial){
        const sanitized = sanitizeHTML(initial);
        quill.setText('');
        quill.clipboard.dangerouslyPasteHTML(0, sanitized, 'api');
      }
    })();

    // Expand modal
    const modalBig = $(container, '#'+ids.modalBig);
    const btnExpand = $(container, '#'+ids.btnExpand);
    const btnCloseBig = $(container, '#'+ids.btnCloseBig);
    let quillBig = null;

    function panelElement(){ return document.querySelector('.qnp-panel'); }
    function isPanelVisible(){ const p = panelElement(); return p && window.getComputedStyle(p).display !== 'none'; }
    function anchorAbovePanel(modal){
      try{
        if (!modal || !isPanelVisible()) return;
        modal.style.position = 'fixed';
        modal.style.margin = '0';
        modal.style.left = '50%';
        modal.style.transform = 'translateX(-50%)';
        modal.style.zIndex = '3000';
        const reposition = () => {
          const p = panelElement(); if (!p) return;
          const rect = p.getBoundingClientRect();
          const mh = modal.offsetHeight || 300;
          const gap = 24;
          let top = rect.top - mh - gap;
          if (top < 8) top = 8;
          modal.style.top = top + 'px';
        };
        reposition();
        modal._reposition = reposition;
        window.addEventListener('resize', reposition);
        // Reintents per assegurar posicionament després del layout del contingut
        setTimeout(reposition, 50);
        setTimeout(reposition, 200);
      }catch(e){}
    }
    function makeDraggable(modal){
      try{
        const head = modal.querySelector('.m-head');
        if (!head) return;
        head.style.cursor = 'move';
        let dragging=false, startX=0, startY=0, startTop=0, startLeft=0;
        const onDown = (e)=>{
          dragging = true;
          const rect = modal.getBoundingClientRect();
          startX = e.clientX; startY = e.clientY; startTop = rect.top; startLeft = rect.left;
          modal.style.position = 'fixed'; modal.style.margin='0';
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp, { once:true });
        };
        const onMove = (e)=>{
          if (!dragging) return;
          const dx = e.clientX - startX, dy = e.clientY - startY;
          const vw = window.innerWidth, vh = window.innerHeight;
          let left = startLeft + dx, top = startTop + dy;
          const rect = modal.getBoundingClientRect();
          if (left < 8) left = 8; if (top < 8) top = 8;
          if (left + rect.width > vw - 8) left = vw - rect.width - 8;
          if (top + rect.height > vh - 8) top = vh - rect.height - 8;
          modal.style.left = left + 'px';
          modal.style.top = top + 'px';
          modal.style.transform = 'none';
        };
        const onUp = ()=>{ dragging=false; document.removeEventListener('mousemove', onMove); };
        head.addEventListener('mousedown', onDown);
      }catch(e){}
    }

    on(btnExpand, 'click', function(){
      if (modalBig && modalBig.showModal) modalBig.showModal();
      anchorAbovePanel(modalBig);
      makeDraggable(modalBig);
      if (!quillBig){
        quillBig = new Quill('#'+ids.modalEditor, {
          theme:'snow',
          modules:{ toolbar:{container:'#'+ids.toolbarFull}, syntax: (typeof hljs !== 'undefined') ? { highlight:function(t){ return hljs.highlightAuto(t).value; } } : undefined }
        });
        quillBig.on('text-change', function(d,o,src){ if (src==='user') quill.setContents(quillBig.getContents()); });
        const bigContainer = modalBig.querySelector('.ql-container');
        if (bigContainer) {
          bigContainer.addEventListener('mousedown', function(e){
            if (e.target.classList.contains('ql-container')) {
              quillBig.focus();
              try { quillBig.setSelection(quillBig.getLength(), 0, 'silent'); } catch {}
            }
          });
        }
        quillBig.root.addEventListener('paste', function(e){
          if (!e.clipboardData) return; e.preventDefault();
          var html = e.clipboardData.getData('text/html') || '';
          var text = e.clipboardData.getData('text/plain') || '';
          var source = html || text.replace(/\n/g,'<br>');
          var clean = sanitizeHTML(source);
          var sel = quillBig.getSelection(true);
          quillBig.clipboard.dangerouslyPasteHTML(sel ? sel.index : quillBig.getLength(), clean, 'user');
        });
      }
      quillBig.setContents(quill.getContents());
      setTimeout(function(){ quillBig.focus(); }, 0);
    });
    on(btnCloseBig, 'click', function(){ if (modalBig) modalBig.close(); });

    // HTML modal
    const modalHTML = $(container, '#'+ids.modalHTML);
    const btnHTML = $(container, '#'+ids.btnHTML);
    const btnCloseHTML = $(container, '#'+ids.btnCloseHTML);
    const btnCopyHTML = $(container, '#'+ids.btnCopyHTML);
    const btnApplyHTML = $(container, '#'+ids.btnApplyHTML);
    const htmlEditor = $(container, '#'+ids.htmlEditor);

    function compactHTML(html){ return html.replace(/>\s+</g,'><').trim(); }
    function pretty(html){ return compactHTML(html).replace(/></g,'>\n<'); }

    on(btnHTML, 'click', function(){ if (!htmlEditor || !modalHTML) return; htmlEditor.value = pretty(quill.root.innerHTML); modalHTML.showModal(); anchorAbovePanel(modalHTML); makeDraggable(modalHTML); htmlEditor.focus(); htmlEditor.setSelectionRange(0,0); });
    on(btnCloseHTML, 'click', function(){ if (modalHTML) modalHTML.close(); });
    on(btnCopyHTML, 'click', function(){ if (!htmlEditor) return; try{ navigator.clipboard.writeText(htmlEditor.value).then(function(){ btnCopyHTML.textContent='✓'; setTimeout(function(){ btnCopyHTML.textContent='⧉'; },900); }); }catch(e){} });
    on(btnApplyHTML, 'click', function(){ if (!htmlEditor || !modalHTML) return; var sanitized = sanitizeHTML(htmlEditor.value); quill.setText(''); quill.clipboard.dangerouslyPasteHTML(0, sanitized, 'api'); modalHTML.close(); });

    // ESC closes modals
    on(document, 'keydown', function(e){ if (e.key==='Escape'){ if (modalBig && modalBig.open) modalBig.close(); if (modalHTML && modalHTML.open) modalHTML.close(); }});

    // Expose instance on container for external control
    try { container.__qre = { quill: quill, target: target }; } catch(e){}
    return { quill, target };
  }

  function isVisible(el){
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' && el.clientHeight === 0) return false;
    const rects = el.getClientRects();
    return rects && rects.length > 0;
  }

  function tryInitPending(){
    document.querySelectorAll('.qre[data-sync-target]:not([data-initialized])').forEach(function(el){
      if (isVisible(el)) {
        attach(el);
        el.setAttribute('data-initialized','1');
      }
    });
  }

  function autoInit(){
    // Initialize visible editors immediately; defer hidden ones until they are shown
    document.querySelectorAll('.qre[data-sync-target]').forEach(function(el){
      if (isVisible(el)) {
        attach(el);
        el.setAttribute('data-initialized','1');
      }
    });
    // Re-try on interactions that might toggle visibility (e.g., opening the panel)
    document.addEventListener('click', tryInitPending, true);
    window.addEventListener('resize', tryInitPending);
    document.addEventListener('visibilitychange', tryInitPending);
    // Observe style/class changes to catch display toggles (e.g., panel open)
    try {
      let scheduled = false;
      const schedule = function(){ if (scheduled) return; scheduled = true; setTimeout(function(){ scheduled = false; tryInitPending(); }, 0); };
      const obs = new MutationObserver(function(muts){
        for (const m of muts){ if (m.type === 'attributes') { schedule(); break; } }
      });
      obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style','class'] });
    } catch(e){}
    // Also poll once shortly after load to catch late-inserted DOM
    setTimeout(tryInitPending, 100);
    setTimeout(tryInitPending, 400);
  }

  // Expose
  window.Quadern = window.Quadern || {};
  window.Quadern.RichEditor = {
    attach: attach,
    autoInit: autoInit,
    getInstance: function(selector){ try { const el = document.querySelector(selector); return el && el.__qre ? el.__qre : null; } catch(e){ return null; } }
  };

  document.addEventListener('DOMContentLoaded', function(){
    autoInit();
  });
})();
