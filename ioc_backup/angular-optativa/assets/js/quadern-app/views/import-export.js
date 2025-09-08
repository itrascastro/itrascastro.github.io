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

    _bindEvents() {
      // Upload area
      const uploadArea = document.getElementById('upload-area');
      const fileInput = document.getElementById('import-file');
      
      if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
          uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadArea.classList.remove('dragover');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            this._handleFileImport(files[0]);
          }
        });
        
        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            this._handleFileImport(e.target.files[0]);
          }
        });
      }

      // Botó d'importar
      const importBtn = document.getElementById('import-btn');
      if (importBtn) {
        importBtn.addEventListener('click', () => this._processImport());
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
      // Actualitzar estadístiques d'exportació
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.ImportExport = ImportExport;

})();