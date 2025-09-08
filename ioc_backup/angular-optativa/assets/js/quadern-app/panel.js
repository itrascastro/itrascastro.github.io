;(function(){
  const U = window.Quadern.Utils; const S = window.Quadern.Store;
  function Panel(){ this.root = null; this.state = null; }
  Panel.prototype.init = function(){
    this.state = S.load();
    this.ensurePanel();
    this.updateTitle();
    this.installHeads();
    this.populateSections();
    this.adjustOffsets();
    window.addEventListener('resize', this.adjustOffsets.bind(this));
  };
  Panel.prototype.ensurePanel = function(){
    if (document.querySelector('.qnp-panel')) return;
    const panel = document.createElement('div'); panel.className = 'qnp-panel'; panel.setAttribute('role','dialog');
    panel.innerHTML = [
      '<div class="qnp-inner">',
      ' <div class="qnp-header">',
      '   <div class="qnp-title"><i class="bi bi-journal-text" aria-hidden="true"></i> Notes d\'aquesta pàgina</div>',
      '   <div class="qnp-actions">',
      '     <button type="button" class="qnp-btn" data-action="close">✕</button>',
      '   </div>',
      ' </div>',
      ' <div class="qnp-body">',
      '   <div class="qnp-row">',
      '     <label class="sr-only" for="qnp-section">Secció</label>',
      '     <select id="qnp-section"></select>',
      '   </div>',
      '   <div class="qnp-split">',
      '     <div class="qnp-sidebar">',
      '       <div class="qnp-list" id="qnp-list"></div>',
      '       <button type="button" class="qnp-btn btn btn-primary qnp-new-note-btn" data-action="clear">',
      '         <i class="bi bi-plus-lg"></i> Nova nota',
      '       </button>',
      '     </div>',
      '     <div class="qnp-editor">',
      '       <input id="qnp-title" class="input" placeholder="Títol de la nota" />',
      '       <input id="qnp-tags" class="input" placeholder="Etiquetes (separades per comes)" />',
      '       <textarea id="qnp-text" placeholder="Escriu la teva nota…" hidden aria-hidden="true"></textarea>',
      '       <div id="qre-panel" class="qre" data-sync-target="#qnp-text" data-no-theme data-adopt-fields="#qnp-title,#qnp-tags"></div>',
      '     </div>',
      '   </div>',
      ' </div>',
      '</div>',
      '',
      '<!-- Modal de confirmació d\'eliminació -->',
      '<div class="qnp-modal" id="qnp-delete-modal" style="display: none;">',
      '  <div class="qnp-modal-backdrop"></div>',
      '  <div class="qnp-modal-content">',
      '    <div class="qnp-modal-header">',
      '      <h3>Eliminar nota</h3>',
      '    </div>',
      '    <div class="qnp-modal-body">',
      '      <div class="qnp-modal-icon">',
      '        <i class="bi bi-exclamation-triangle"></i>',
      '      </div>',
      '      <p id="qnp-delete-message">Estàs segur que vols eliminar aquesta nota?</p>',
      '      <p class="qnp-modal-warning">Aquesta acció no es pot desfer.</p>',
      '    </div>',
      '    <div class="qnp-modal-footer">',
      '      <button type="button" class="qnp-btn btn btn-outline" data-action="cancel">Cancel·lar</button>',
      '      <button type="button" class="qnp-btn qnp-danger btn" data-action="confirm-delete">Eliminar</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '',
      '<!-- Modal d\'error de validació -->',
      '<div class="qnp-modal" id="qnp-validation-modal" style="display: none;">',
      '  <div class="qnp-modal-backdrop"></div>',
      '  <div class="qnp-modal-content">',
      '    <div class="qnp-modal-header">',
      '      <h3>Formulari incomplet</h3>',
      '    </div>',
      '    <div class="qnp-modal-body">',
      '      <div class="qnp-modal-icon">',
      '        <i class="bi bi-exclamation-circle"></i>',
      '      </div>',
      '      <p id="qnp-validation-message">Afegeix un títol i contingut per desar la nota.</p>',
      '    </div>',
      '    <div class="qnp-modal-footer">',
      '      <button type="button" class="qnp-btn btn btn-primary" data-action="ok">D\'acord</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);
    this.root = panel;
    this.bind();
  };
  Panel.prototype.bind = function(){
    const r = this.root; if (!r) return;
    r.querySelector('[data-action="close"]').addEventListener('click', ()=> this.toggle(false));
    r.querySelector('[data-action="clear"]').addEventListener('click', ()=> this.clearEditor());
    r.querySelector('#qnp-section').addEventListener('change', ()=> this.refreshList());
    
    // Modal de confirmació
    const deleteModal = document.querySelector('#qnp-delete-modal');
    deleteModal.querySelector('[data-action="cancel"]').addEventListener('click', ()=> this.hideDeleteModal());
    deleteModal.querySelector('[data-action="confirm-delete"]').addEventListener('click', ()=> this.executeDelete());
    deleteModal.querySelector('.qnp-modal-backdrop').addEventListener('click', ()=> this.hideDeleteModal());
    
    // Modal de validació
    const validationModal = document.querySelector('#qnp-validation-modal');
    validationModal.querySelector('[data-action="ok"]').addEventListener('click', ()=> this.hideValidationModal());
    validationModal.querySelector('.qnp-modal-backdrop').addEventListener('click', ()=> this.hideValidationModal());

    // Autosave on input changes
    const titleEl = r.querySelector('#qnp-title');
    const tagsEl = r.querySelector('#qnp-tags');
    const textEl = r.querySelector('#qnp-text');
    const schedule = this.scheduleAutosave.bind(this);
    if (titleEl) titleEl.addEventListener('input', schedule);
    if (tagsEl) tagsEl.addEventListener('input', schedule);
    if (textEl) textEl.addEventListener('input', schedule);
  };
  Panel.prototype.toggle = function(show){
    this.root.style.display = (show===false)?'none':'block';
    // Recalcular offsets per evitar deixar espai reservat quan s'oculta
    try { this.adjustOffsets(); } catch(e){}
  };
  // Netejar text d'un H2 eliminant botons/badges afegits al DOM
  function cleanHeaderText(h2){
    try {
      const clone = h2.cloneNode(true);
      // Eliminar botons i badges que afegeixen números o icones
      clone.querySelectorAll('.qnp-add, .add-note-btn, .qnp-badge, button, .btn, .badge').forEach(n=> n.remove());
      return (clone.textContent||'').trim();
    } catch(e){
      return (h2.textContent||'').trim();
    }
  }
  Panel.prototype.scanSections = function(){
    const headers = U.$all('.content-body h2');
    return headers.map(h2 => ({ id: h2.id||'', title: cleanHeaderText(h2) }));
  };
  Panel.prototype.populateSections = function(){
    const sel = this.root.querySelector('#qnp-section'); sel.innerHTML='';
    this.scanSections().forEach(s => { if(!s.id) return; const opt=document.createElement('option'); opt.value=s.id; opt.textContent=s.title||s.id; sel.appendChild(opt); });
  };
  Panel.prototype.sectionContext = function(){
    const unitat = Number(document.querySelector('meta[name="page-unitat"]')?.getAttribute('content')) || undefined;
    const bloc = Number(document.querySelector('meta[name="page-bloc"]')?.getAttribute('content')) || undefined;
    const base = document.body.getAttribute('data-baseurl')||''; const pageUrl = base + (location.pathname||'');
    const sectionId = this.root.querySelector('#qnp-section')?.value || '';
    const h2 = document.getElementById(sectionId);
    const sectionTitle = h2 ? cleanHeaderText(h2) : '';
    return { unitat, bloc, pageUrl, sectionId, sectionTitle };
  };
  Panel.prototype.updateTitle = function(){
    if (!this.root) return;
    const el = this.root.querySelector('.qnp-title');
    if (!el) return;
    const ctx = this.sectionContext();
    let label = "Notes d'aquesta pàgina";
    const parts = [];
    if (Number.isFinite(ctx.unitat)) parts.push(`Unitat ${ctx.unitat}`);
    if (Number.isFinite(ctx.bloc)) parts.push(`Bloc ${ctx.bloc}`);
    if (parts.length) label = parts.join(' > ');
    el.innerHTML = `<i class="bi bi-journal-text" aria-hidden="true"></i> ${label}`;
  };
  Panel.prototype.refresh = function(){ this.populateSections(); this.refreshList(); };
  Panel.prototype.refreshList = function(){
    const ctx = this.sectionContext(); if (!ctx.sectionId) return;
    const list = this.root.querySelector('#qnp-list'); list.innerHTML='';
    const state = this.state; const notes = S.notesForSection(state, ctx.pageUrl, ctx.sectionId);
    if (!notes.length) { 
      list.innerHTML = '<div class="qnp-empty">Cap nota encara. Crea la primera!</div>'; 
      this.clearEditor(); 
      return; 
    }
    notes.sort((a,b)=> new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
    notes.forEach(n => {
      const item = document.createElement('div'); item.className='qnp-item'; item.setAttribute('data-id', n.id);
      const title = n.noteTitle || n.sectionTitle || n.sectionId || '';
      const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
      const time = U.timeAgo(n.updatedAt||n.createdAt||'');
      item.innerHTML = `
        <div class="qnp-item-header">
          <div class="qnp-item-title">${truncatedTitle} <span class="qnp-item-time">(${time})</span></div>
          <div class="qnp-item-actions">
            <button type="button" class="qnp-btn-icon" data-action="edit" data-id="${n.id}" title="Editar nota">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="qnp-btn-icon qnp-btn-delete" data-action="delete" data-id="${n.id}" title="Eliminar nota">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="qnp-item-tags">${(n.tags||[]).map(t=>`<span class="qnp-tag">${t}</span>`).join('')}</div>`;
      
      // Event listeners per als botons
      item.querySelector('[data-action="edit"]').addEventListener('click', (e)=> { e.stopPropagation(); this.loadEditor(n.id); });
      item.querySelector('[data-action="delete"]').addEventListener('click', (e)=> { e.stopPropagation(); this.confirmDelete(n.id); });
      
      // Click a tota la nota per editar
      item.addEventListener('click', ()=> this.loadEditor(n.id));
      
      list.appendChild(item);
    });
    
    this.updateHeadCounts();
    this.syncEditorHeight();
  };
  Panel.prototype.clearEditor = function(){
    this.root.querySelector('#qnp-title').value='';
    this.root.querySelector('#qnp-tags').value='';
    this.root.querySelector('#qnp-text').value='';
    this.currentId = null;
  };
  Panel.prototype.loadEditor = function(id){
    const n = this.state.notes.byId[id]; if(!n) return;
    this.currentId = id;
    this.root.querySelector('#qnp-title').value = n.noteTitle||'';
    this.root.querySelector('#qnp-tags').value = (n.tags||[]).join(', ');
    this.root.querySelector('#qnp-text').value = n.content||'';
  };
  // Helpers de validació/normalització
  Panel.prototype._normalizeTags = function(tags){
    const seen = new Set();
    const out = [];
    (tags||[]).forEach(t => {
      const clean = String(t||'').trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(clean); }
    });
    return out;
  };
  Panel.prototype._hasDuplicateTitleInSection = function(title, ctx, excludeId){
    if (!title || !ctx || !ctx.sectionId) return false;
    const state = this.state;
    const list = S.notesForSection(state, ctx.pageUrl, ctx.sectionId) || [];
    const key = String(title).trim().toLowerCase();
    return list.some(n => n && n.id !== excludeId && String(n.noteTitle||'').trim().toLowerCase() === key);
  };
  Panel.prototype.saveNote = function(){
    const title = this.root.querySelector('#qnp-title').value.trim();
    const content = this.root.querySelector('#qnp-text').value.trim();
    const tagsRaw = (this.root.querySelector('#qnp-tags').value||'').split(',');
    const tags = this._normalizeTags(tagsRaw);
    
    // Validació: requereix títol I contingut
    if (!title || !content) {
      this.showValidationModal('Afegeix un títol i contingut per desar la nota.');
      return;
    }
    
    if (this.currentId) {
      // Actualitzar nota existent
      const n = this.state.notes.byId[this.currentId];
      if (n) {
        // Validar duplicat de títol dins de la mateixa secció
        const ctxUpd = { pageUrl: n.pageUrl, sectionId: n.sectionId };
        if (this._hasDuplicateTitleInSection(title, ctxUpd, n.id)) {
          this.showValidationModal('Ja existeix una nota amb el mateix títol en aquesta secció.');
          return;
        }
        n.noteTitle = title;
        n.tags = tags;
        n.content = content;
        n.updatedAt = U.nowISO();
        S.save(this.state);
        this.refreshList();
        this.updateHeadCounts();
        this.clearEditor();
      }
    } else {
      // Crear nova nota
      const ctx = this.sectionContext();
      if (!ctx.sectionId) {
        this.showValidationModal('Selecciona una secció per crear la nota.');
        return;
      }
      // Validar duplicat de títol
      if (this._hasDuplicateTitleInSection(title, ctx, null)) {
        this.showValidationModal('Ja existeix una nota amb el mateix títol en aquesta secció.');
        return;
      }
      const n = Object.assign({
        id: '',
        noteTitle: title,
        tags: tags,
        content: content,
        createdAt: U.nowISO(),
        updatedAt: U.nowISO()
      }, ctx);
      S.upsertNote(this.state, n);
      S.save(this.state);
      this.refreshList();
      this.updateHeadCounts();
      this.clearEditor();
    }
  };
  // Autosave helpers (no modals, no clearing editor)
  Panel.prototype.scheduleAutosave = function(){
    clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(()=> this.saveNoteAuto(), 1200);
  };
  Panel.prototype.saveNoteAuto = function(){
    const title = this.root.querySelector('#qnp-title').value.trim();
    const contentHTML = (this.root.querySelector('#qnp-text')?.value || '').trim();
    const contentText = contentHTML.replace(/<[^>]*>/g,'').trim();
    const tags = this._normalizeTags((this.root.querySelector('#qnp-tags').value||'').split(','));
    if (!title || !contentText) return; // defer until both exist
    if (this.currentId) {
      const n = this.state.notes.byId[this.currentId];
      if (n) {
        // Evitar duplicats dins la mateixa secció
        const ctxUpd = { pageUrl: n.pageUrl, sectionId: n.sectionId };
        if (this._hasDuplicateTitleInSection(title, ctxUpd, n.id)) return;
        n.noteTitle = title; n.tags = tags; n.content = contentHTML; n.updatedAt = U.nowISO();
        S.save(this.state); this.refreshList(); this.updateHeadCounts();
      }
    } else {
      const ctx = this.sectionContext(); if (!ctx.sectionId) return;
      if (this._hasDuplicateTitleInSection(title, ctx, null)) return;
      const n = Object.assign({ id:'', noteTitle:title, tags:tags, content:contentHTML, createdAt:U.nowISO(), updatedAt:U.nowISO() }, ctx);
      const created = S.upsertNote(this.state, n); this.currentId = created.id; S.save(this.state);
      this.refreshList(); this.updateHeadCounts();
    }
  };
  Panel.prototype.confirmDelete = function(noteId){
    const note = this.state.notes.byId[noteId];
    if (!note) return;
    
    // Guardar l'ID de la nota a eliminar
    this.noteToDelete = noteId;
    
    // Truncar títol si és massa llarg
    const title = note.noteTitle || 'Sense títol';
    const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
    
    // Actualitzar el missatge del modal
    const messageEl = document.querySelector('#qnp-delete-message');
    messageEl.textContent = `Estàs segur que vols eliminar la nota "${truncatedTitle}"?`;
    
    // Mostrar el modal
    this.showDeleteModal();
  };
  
  Panel.prototype.showDeleteModal = function(){
    const modal = document.querySelector('#qnp-delete-modal');
    modal.style.display = 'flex';
    // Afegir classe per animació
    setTimeout(() => modal.classList.add('qnp-modal-show'), 10);
  };
  
  Panel.prototype.hideDeleteModal = function(){
    const modal = document.querySelector('#qnp-delete-modal');
    modal.classList.remove('qnp-modal-show');
    setTimeout(() => modal.style.display = 'none', 300);
    this.noteToDelete = null;
  };
  
  Panel.prototype.executeDelete = function(){
    if (this.noteToDelete) {
      this.deleteNote(this.noteToDelete);
      this.hideDeleteModal();
    }
  };
  
  Panel.prototype.showValidationModal = function(message){
    const modal = document.querySelector('#qnp-validation-modal');
    const messageEl = document.querySelector('#qnp-validation-message');
    messageEl.textContent = message || 'Afegeix un títol i contingut per desar la nota.';
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('qnp-modal-show'), 10);
  };
  
  Panel.prototype.hideValidationModal = function(){
    const modal = document.querySelector('#qnp-validation-modal');
    modal.classList.remove('qnp-modal-show');
    setTimeout(() => modal.style.display = 'none', 300);
  };
  
  Panel.prototype.deleteNote = function(noteId){
    S.deleteNote(this.state, noteId); 
    S.save(this.state); 
    this.refreshList(); 
    this.updateHeadCounts();
    try { if (window.Quadern?.App?.refreshData) window.Quadern.App.refreshData(); } catch {}
    
    // Si s'està editant aquesta nota, netejar l'editor
    if (this.currentId === noteId) {
      this.clearEditor();
    }
  };

  // H2 buttons with count badge
  Panel.prototype.installHeads = function(){
    const headers = U.$all('.content-body h2');
    headers.forEach(h2 => {
      if (!h2.id) return;
      if (h2.querySelector('.qnp-add')) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'qnp-add';
      btn.innerHTML = '<i class="bi bi-journal-text" aria-hidden="true"></i><span class="qnp-badge" hidden>0</span>';
      const style = window.getComputedStyle(h2); if (style.position === 'static') h2.style.position = 'relative';
      btn.addEventListener('click', () => { this.openForSection(h2.id); });
      h2.appendChild(btn);
    });
    this.updateHeadCounts();
  };
  Panel.prototype.updateHeadCounts = function(){
    const base = document.body.getAttribute('data-baseurl')||''; const pageUrl = base + (location.pathname||'');
    U.$all('.content-body h2').forEach(h2 => {
      if (!h2.id) return;
      const count = S.countForSection(this.state, pageUrl, h2.id) || 0;
      const badge = h2.querySelector('.qnp-add .qnp-badge');
      if (badge) {
        badge.textContent = String(count);
        badge.hidden = !(count > 0);
      }
      const icon = h2.querySelector('.qnp-add i');
      if (icon) icon.className = 'bi ' + (count>0 ? 'bi-journal-check' : 'bi-journal-text');
    });
  };
  Panel.prototype.openForSection = function(sectionId){
    this.toggle(true);
    const sel = this.root.querySelector('#qnp-section');
    if (sel) { sel.value = sectionId; }
    this.refreshList();
    
    // Sempre mostrar formulari buit per crear nova nota
    this.clearEditor();
    
    this.adjustOffsets();
    this.syncEditorHeight();
  };
  // Selecciona la secció només si el panell ja està obert (no neteja editor)
  Panel.prototype.selectSectionOnly = function(sectionId){
    const sel = this.root.querySelector('#qnp-section');
    if (sel) {
      sel.value = sectionId;
      this.refreshList();
      this.updateHeadCounts();
      this.syncEditorHeight();
    }
  };
  Panel.prototype.adjustOffsets = function(){
    const footer = document.querySelector('.footer, .quadern-footer');
    const h = footer ? footer.offsetHeight : 0;
    this.root.style.bottom = h + 'px';
    const main = document.querySelector('.main-content, .quadern-main');
    if (main) main.style.paddingBottom = `calc(${h + (this.root.offsetHeight||0) + 20}px)`;
    this.syncEditorHeight();
  };

  // Match editor height to sidebar height so bottoms align
  Panel.prototype.syncEditorHeight = function(){
    if (!this.root) return;
    const qre = this.root.querySelector('#qre-panel');
    const newBtn = this.root.querySelector('.qnp-new-note-btn');
    const sidebar = this.root.querySelector('.qnp-sidebar');
    if (!qre || !sidebar) return;
    // Measure after layout to avoid intermediate states
    requestAnimationFrame(()=>{
      const qreTop = qre.getBoundingClientRect().top;
      const targetBottom = (newBtn && newBtn.getBoundingClientRect().bottom) || sidebar.getBoundingClientRect().bottom;
      const desired = Math.max(240, Math.floor(targetBottom - qreTop));
      if (!desired || desired <= 0) return;
      // Set QRE box height to match sidebar bottom; internal layout handled by CSS flex
      qre.style.height = desired + 'px';
    });
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.Panel = Panel;
})();
