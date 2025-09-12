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
      const exportJsonBtn = document.getElementById('export-json-btn');
      if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => this._exportJSON());
      }
    },

    _handleFileImport(file) {
      console.log('📤 ImportExport: Processant fitxer:', file.name);
      // Implementació simplificada
    },

    _processImport() {
      console.log('📤 ImportExport: Processant importació');
      // Implementació futura
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
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.ImportExport = ImportExport;

})();