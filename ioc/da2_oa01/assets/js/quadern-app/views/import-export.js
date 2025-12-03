/*
  Quadern de Notes - Vista Import/Export
  Gestió d'importació i exportació de dades
*/

;(function() {
  'use strict';

  const ImportExport = {
    app: null,

    init(app) {
      this.app = app;
      console.log('📤 ImportExport: Inicialitzant vista import/export...');
      this._bindEvents();
      console.log('✅ ImportExport: Vista inicialitzada');
    },

    activate() {
      console.log('📤 ImportExport: Activant vista import/export...');
      this.refreshData();
    },

    _bindEvents() {
      // Botó d'exportació JSON
      const exportBtn = document.getElementById('export-json-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', ()=> this._exportJSON());
      }
      // Botó d'importació → obrir selector
      const importBtn = document.getElementById('import-json-btn');
      const importInput = document.getElementById('import-file-input');
      if (importBtn && importInput) {
        importBtn.addEventListener('click', ()=> importInput.click());
        importInput.addEventListener('change', (e)=>{
          const file = e.target.files && e.target.files[0];
          if (file) {
            this._handleFileImport(file);
            // Reset per permetre seleccionar mateix fitxer de nou
            importInput.value = '';
          }
        });
      }
    },

    _handleFileImport(file) {
      console.log('📤 ImportExport: Processant fitxer:', file.name);
      const reader = new FileReader();
      reader.onload = (e)=>{
        try {
          const text = e.target.result;
          const data = JSON.parse(text);
          this._processImport(data, file.name);
        } catch(err){
          this._toast('Fitxer invàlid o corrupte', 'error');
          console.error('Import parse error', err);
        }
      };
      reader.onerror = ()=> this._toast('No s\'ha pogut llegir el fitxer', 'error');
      reader.readAsText(file);
    },

    _processImport(data, filename='backup.json') {
      console.log('📤 ImportExport: Processant importació');
      if (!data || typeof data !== 'object') {
        this._toast('El fitxer no té un format d\'exportació vàlid', 'error');
        return;
      }
      const baseurl = document.body.getAttribute('data-baseurl') || '';
      const courseId = (window.siteConfig && window.siteConfig.title) || '';
      // Validacions mínimes
      if (!Array.isArray(data.notes)) {
        this._toast('El backup no conté notes', 'error');
        return;
      }
      // Bloquejar restaurar d\'un altre curs/baseurl
      const backupBase = (data.courseInfo && data.courseInfo.baseurl) || '';
      const backupTitle = (data.courseInfo && data.courseInfo.title) || '';
      if (backupBase && backupBase !== baseurl) {
        this._toast('El backup pertany a un altre curs (baseurl diferent)', 'warning');
        return;
      }
      if (backupTitle && courseId && backupTitle !== courseId) {
        this._toast('El backup pertany a un altre curs (títol diferent)', 'warning');
        return;
      }
      const count = this._restoreNotes(data.notes);
      this._toast(`Importació completada: ${count} notes restaurades`, 'success');
      try { this.app?.refreshData?.(); } catch(e){}
      this.refreshData();
    },

    refreshData() {
      this._updateExportStats();
    },

    _updateExportStats() {
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const notes = Object.values(state.notes.byId || {});
        
        // Actualitzar número de notes
        const notesCountEl = document.getElementById('export-notes-count');
        if (notesCountEl) {
          notesCountEl.textContent = notes.length.toString();
        }
        
        // Actualitzar última modificació
        const lastModifiedEl = document.getElementById('export-last-modified');
        if (lastModifiedEl && notes.length > 0) {
          const lastModified = notes.reduce((latest, note) => {
            const noteDate = new Date(note.updatedAt || note.createdAt);
            return noteDate > latest ? noteDate : latest;
          }, new Date(0));
          
          lastModifiedEl.textContent = lastModified.toLocaleDateString('ca-ES');
        }
      }
    },

    _exportJSON() {
      if (this.app && this.app.modules && this.app.modules.formatters) {
        this.app.modules.formatters._exportJSON();
      } else {
        console.warn('ImportExport: Mòdul formatters no disponible');
      }
    },

    _restoreNotes(notesArr){
      if (!Array.isArray(notesArr)) return 0;
      const baseurl = document.body.getAttribute('data-baseurl') || '';
      const state = window.Quadern?.Store?.load ? window.Quadern.Store.load() : { notes:{} };
      const byId = {};
      const bySection = {};
      const orderBySection = {};
      notesArr.forEach(n=>{
        if (!n || !n.sectionId) return;
        const copy = Object.assign({}, n);
        // Normalitzar url i netejar sectionTitle
        copy.sectionTitle = '';
        if (copy.pageUrl) {
          // Evitar prefix duplicat i assegurar baseurl
          if (baseurl) {
            const path = copy.pageUrl.replace(baseurl, '');
            copy.pageUrl = path.startsWith('/') ? baseurl + path : baseurl + '/' + path;
          }
        }
        if (!copy.id) { copy.id = (window.Quadern?.Utils?.uid ? window.Quadern.Utils.uid('note') : `note_${Date.now()}`); }
        byId[copy.id] = copy;
        const key = `${copy.pageUrl||''}#${copy.sectionId}`;
        bySection[key] = bySection[key] || [];
        bySection[key].push(copy.id);
        orderBySection[key] = orderBySection[key] || [];
        orderBySection[key].push(copy.id);
      });
      const total = Object.keys(byId).length;
      state.notes = {
        byId,
        bySection,
        orderBySection,
        counters: { total }
      };
      try { window.Quadern.Store.save(state); } catch(e){ console.error('Save after import failed', e); }
      return total;
    },

    _toast(msg, type='info'){
      try {
        if (this.app?.modules?.components?.showToast) {
          this.app.modules.components.showToast(msg, type);
        }
      } catch(e){
        console.log('Toast:', msg);
      }
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.ImportExport = ImportExport;

})();
