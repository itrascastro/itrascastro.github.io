/*
  Quadern de Notes - Formatters i Exportadors
  Utilitats per exportar notes en diferents formats
*/

;(function() {
  'use strict';

  const Formatters = {
    app: null,

    init(app) {
      this.app = app;
      console.log('📄 Formatters: Inicialitzant formatters...');
      console.log('✅ Formatters: Formatters inicialitzats');
    },

    export(format) {
      console.log('📄 Formatters: Exportant en format:', format);
      
      switch(format) {
        case 'json':
          this._exportJSON();
          break;
        case 'markdown':
          this._exportMarkdown();
          break;
        case 'txt':
          this._exportText();
          break;
        case 'html':
          this._exportHTML();
          break;
        default:
          console.warn('Format d\'exportació desconegut:', format);
      }
    },

    async _exportJSON() {
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const data = {
          exportDate: new Date().toISOString(),
          version: '2.0',
          notes: Object.values(state.notes.byId || {})
        };
        
        this._download('quadern-notes.json', JSON.stringify(data, null, 2));
        this._showToast('Notes exportades en format JSON', 'success');
      }
    },

    async _exportMarkdown() {
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const notes = Object.values(state.notes.byId || {});
        
        let markdown = `# Quadern de Notes\n\n`;
        markdown += `*Exportat el ${new Date().toLocaleDateString('ca-ES')}*\n\n`;
        
        // Agrupar per unitat/bloc
        const grouped = this._groupNotesByLocation(notes);
        
        Object.entries(grouped).forEach(([location, locationNotes]) => {
          markdown += `## ${location}\n\n`;
          
          locationNotes.forEach(note => {
            if (note.content && note.content.trim()) {
              markdown += `### ${note.noteTitle || 'Sense títol'}\n\n`;
              
              if (note.tags && note.tags.length > 0) {
                markdown += `*Etiquetes: ${note.tags.map(tag => `#${tag}`).join(' ')}*\n\n`;
              }
              
              markdown += `${note.content}\n\n`;
              markdown += `---\n\n`;
            }
          });
        });
        
        this._download('quadern-notes.md', markdown);
        this._showToast('Notes exportades en format Markdown', 'success');
      }
    },

    async _exportText() {
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const notes = Object.values(state.notes.byId || {});
        
        let text = `QUADERN DE NOTES\n`;
        text += `================\n\n`;
        text += `Exportat el ${new Date().toLocaleString('ca-ES')}\n\n`;
        
        const grouped = this._groupNotesByLocation(notes);
        
        Object.entries(grouped).forEach(([location, locationNotes]) => {
          text += `${location.toUpperCase()}\n`;
          text += `${'-'.repeat(location.length)}\n\n`;
          
          locationNotes.forEach(note => {
            if (note.content && note.content.trim()) {
              text += `${note.noteTitle || 'Sense títol'}\n`;
              
              if (note.tags && note.tags.length > 0) {
                text += `Etiquetes: ${note.tags.join(', ')}\n`;
              }
              
              text += `\n${note.content}\n\n`;
              text += `${'='.repeat(50)}\n\n`;
            }
          });
        });
        
        this._download('quadern-notes.txt', text);
        this._showToast('Notes exportades en format text', 'success');
      }
    },

    async _exportHTML() {
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const notes = Object.values(state.notes.byId || {});
        
        const grouped = this._groupNotesByLocation(notes);
        
        let html = `
<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quadern de Notes</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        .note { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .note-title { font-weight: bold; margin-bottom: 10px; }
        .note-tags { font-size: 0.9em; color: #6c757d; margin-bottom: 10px; }
        .note-content { white-space: pre-wrap; }
        .export-info { color: #6c757d; font-size: 0.9em; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>📔 Quadern de Notes</h1>
    <div class="export-info">Exportat el ${new Date().toLocaleString('ca-ES')}</div>
        `;
        
        Object.entries(grouped).forEach(([location, locationNotes]) => {
          html += `<h2>${location}</h2>\n`;
          
          locationNotes.forEach(note => {
            if (note.content && note.content.trim()) {
              html += `
                <div class="note">
                    <div class="note-title">${this._escapeHtml(note.noteTitle || 'Sense títol')}</div>
                    ${note.tags && note.tags.length > 0 ? `
                        <div class="note-tags">Etiquetes: ${note.tags.map(tag => `#${tag}`).join(' ')}</div>
                    ` : ''}
                    <div class="note-content">${this._escapeHtml(note.content)}</div>
                </div>
              `;
            }
          });
        });
        
        html += `
</body>
</html>`;
        
        this._download('quadern-notes.html', html);
        this._showToast('Notes exportades en format HTML', 'success');
      }
    },

    _groupNotesByLocation(notes) {
      const grouped = {};
      
      notes.forEach(note => {
        let location = 'Sense ubicació';
        
        if (note.unitat && note.bloc) {
          location = `Unitat ${note.unitat} - Bloc ${note.bloc}`;
        } else if (note.unitat) {
          location = `Unitat ${note.unitat}`;
        } else if (note.sectionTitle) {
          location = note.sectionTitle;
        }
        
        if (!grouped[location]) {
          grouped[location] = [];
        }
        
        grouped[location].push(note);
      });
      
      // Ordenar notes dins de cada ubicació
      Object.keys(grouped).forEach(location => {
        grouped[location].sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
      });
      
      return grouped;
    },

    _download(filename, content) {
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    },

    _escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    },

    _showToast(message, type) {
      if (this.app.modules.components && this.app.modules.components.showToast) {
        this.app.modules.components.showToast(message, type);
      }
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.Formatters = Formatters;

})();