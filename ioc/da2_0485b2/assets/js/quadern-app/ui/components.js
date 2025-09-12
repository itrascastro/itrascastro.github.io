/*
  Quadern de Notes - Components UI
  Components reutilitzables (modals, toasts, etc.)
*/

;(function() {
  'use strict';

  const Components = {
    app: null,

    init(app) {
      this.app = app;
      console.log('🎨 Components: Inicialitzant components UI...');
      this._initializeTheme();
      console.log('✅ Components: Components inicialitzats');
    },

    _initializeTheme() {
      // Carregar tema guardat
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
      }
    },

    showToast(message, type = 'info', duration = 3000) {
      console.log(`🎨 Toast [${type}]:`, message);
      
      // Eliminar toasts anteriors
      const existingToasts = document.querySelectorAll('.toast');
      existingToasts.forEach(toast => toast.remove());

      // Crear nou toast
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <div class="toast-content">
          <i class="bi ${this._getToastIcon(type)}"></i>
          <span class="toast-message">${message}</span>
          <button class="toast-close" type="button">
            <i class="bi bi-x"></i>
          </button>
        </div>
      `;

      document.body.appendChild(toast);

      // Mostrar amb animació
      setTimeout(() => toast.classList.add('show'), 10);

      // Auto-ocultar
      setTimeout(() => {
        this.hideToast(toast);
      }, duration);

      // Bind close button
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideToast(toast));
      }

      return toast;
    },

    hideToast(toast = null) {
      const toastEl = toast || document.querySelector('.toast.show');
      if (toastEl) {
        toastEl.classList.remove('show');
        setTimeout(() => {
          if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
          }
        }, 300);
      }
    },

    _getToastIcon(type) {
      switch(type) {
        case 'success': return 'bi-check-circle';
        case 'error': return 'bi-x-circle';
        case 'warning': return 'bi-exclamation-triangle';
        default: return 'bi-info-circle';
      }
    },

    showModal(title, content, actions = [], options = {}) {
      console.log('🎨 Modal:', title);
      
      // Eliminar modals anteriors
      this.closeModal();

      // Estructura compatible amb els estils (modal + modal-content)
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close" type="button">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${actions.length > 0 ? `
            <div class="modal-footer">
              ${actions.map(action => `
                <button class="btn ${action.class || 'btn-secondary'}" data-action="${action.action}">
                  ${action.text}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(modal);

      // Click fora per tancar
      if (options.backdropClose !== false) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal();
          }
        });
      }

      // Botó tancar
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

      // Botons d'acció
      const actionBtns = modal.querySelectorAll('[data-action]');
      actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action;
          this._handleModalAction(action, modal);
        });
      });

      return modal;
    },

    closeModal() {
      const modal = document.querySelector('.modal.active');
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    },

    _handleModalAction(action, modal) {
      console.log('🎨 Modal action:', action);
      
      switch(action) {
        case 'close':
        case 'cancel':
          this.closeModal();
          break;
        default:
          // Deixar que altres mòduls gestionin l'acció
          break;
      }
    },

    showConfirmDialog(message, onConfirm, onCancel = null) {
      return new Promise((resolve) => {
        const modal = this.showModal('Confirmació', message, [
          { text: 'Cancel·la', action: 'cancel', class: 'btn-secondary' },
          { text: 'Confirma', action: 'confirm', class: 'btn-primary' }
        ]);

        modal.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (action === 'confirm') {
            if (onConfirm) onConfirm();
            resolve(true);
            this.closeModal();
          } else if (action === 'cancel') {
            if (onCancel) onCancel();
            resolve(false);
            this.closeModal();
          }
        });
      });
    },

    updateFooterStats() {
      console.log('🎨 Components: Actualitzant estadístiques del peu');
      
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        const notes = Object.values(state.notes.byId || {});
        const notesWithContent = notes.filter(n => n.content && n.content.trim());

        // Actualitzar total notes
        const totalNotesEl = document.getElementById('total-notes');
        if (totalNotesEl) {
          totalNotesEl.textContent = `${notesWithContent.length} notes`;
        }

        // Actualitzar mida d'emmagatzematge
        const storageSizeEl = document.getElementById('storage-size');
        if (storageSizeEl) {
          const size = this._calculateStorageSize(notesWithContent);
          storageSizeEl.textContent = size;
        }

        // Actualitzar última sincronització
        const lastSyncEl = document.getElementById('last-sync');
        if (lastSyncEl) {
          const now = new Date();
          lastSyncEl.textContent = `Actualitzat ${now.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Estadístiques de curs: unitats, blocs, seccions
        try {
          let stats = null;
          if (window.Quadern?.Discovery?.getStructureStats) {
            stats = window.Quadern.Discovery.getStructureStats();
          }
          if (!stats && window.courseData) {
            // Fallback aproximat des de site.curs
            const unitats = (window.courseData.unitats || []).length || 0;
            const blocs = (window.courseData.unitats || []).reduce((sum, u) => sum + (u.blocs || []).length, 0);
            const seccions = 0; // no disponible sense escanejar
            stats = { unitats, blocs, seccions };
          }
          if (stats) {
            const uEl = document.getElementById('footer-units');
            const bEl = document.getElementById('footer-blocks');
            const sEl = document.getElementById('footer-sections');
            if (uEl) uEl.textContent = `${stats.unitats || 0} unitats`;
            if (bEl) bEl.textContent = `${stats.blocs || 0} blocs`;
            if (sEl) sEl.textContent = `${stats.seccions || 0} seccions`;
          }
        } catch (e) {
          console.warn('Footer stats (course) unavailable:', e);
        }
      }
    },

    _calculateStorageSize(notes) {
      const totalChars = notes.reduce((sum, note) => {
        return sum + (note.content || '').length + (note.noteTitle || '').length;
      }, 0);
      
      const bytes = totalChars * 2; // Aproximació UTF-16
      
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
      return `${Math.round(bytes / 1048576 * 10) / 10} MB`;
    },

    // Utilitat per crear loader
    createLoader(text = 'Carregant...') {
      const loader = document.createElement('div');
      loader.className = 'loader';
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">${text}</div>
      `;
      return loader;
    },

    // Utilitat per crear estat buit
    createEmptyState(icon, title, description, action = null) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">
          <i class="bi ${icon}"></i>
        </div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-description">${description}</p>
        ${action ? `
          <button class="btn btn-primary" data-action="${action.action}">
            ${action.icon ? `<i class="bi ${action.icon}"></i>` : ''} ${action.text}
          </button>
        ` : ''}
      `;
      return emptyState;
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.Components = Components;

})();
