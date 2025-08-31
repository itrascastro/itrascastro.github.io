/*
  Quadern de Notes - Sistema de Descobriment d'Estructura
  Detecta i carrega l'estructura completa del curs
*/

;(function() {
  'use strict';

  const Discovery = {
    app: null,
    courseStructure: null,
    sectionsCache: new Map(),

    // =============================
    // INICIALITZACIÓ
    // =============================

    init(app) {
      this.app = app;
      console.log('🔍 Discovery: Inicialitzant sistema de descobriment...');
      console.log('✅ Discovery: Sistema inicialitzat');
    },

    // =============================
    // CÀRREGA D'ESTRUCTURA COMPLETA
    // =============================

    async loadCompleteStructure() {
      console.log('🔍 Discovery: Carregant estructura completa del curs...');
      
      try {
        // 1. Verificar dades del curs de Jekyll
        if (!window.courseData) {
          console.warn('🟨 Discovery: No s\'han trobat dades del curs');
          return this._fallbackToNotesStructure();
        }

        console.log('🔍 Discovery: Dades del curs trobades:', window.courseData);

        // 2. Construir estructura completa des de la configuració
        const completeStructure = this._buildCompleteStructure();
        
        this.courseStructure = completeStructure;
        
        // Guardar estructura al localStorage
        this._saveCourseToStorage(completeStructure);
        
        console.log('✅ Discovery: Estructura completa carregada i guardada');
        
        return completeStructure;
        
      } catch (error) {
        console.error('❌ Discovery: Error carregant estructura:', error);
        return this._fallbackToNotesStructure();
      }
    },

    _buildCompleteStructure() {
      const structure = {};
      
      if (!window.courseData || !window.courseData.unitats) {
        console.warn('🟨 Discovery: No hi ha dades del curs disponibles');
        return structure;
      }
      
      window.courseData.unitats.forEach((unitat, uIndex) => {
        const unitKey = `unitat-${unitat.numero}`;
        
        structure[unitKey] = {
          id: unitat.numero,
          nom: unitat.nom,
          descripcio: unitat.descripcio,
          order: uIndex,
          noteCount: 0,
          blocs: {}
        };
        
        if (unitat.blocs) {
          unitat.blocs.forEach((bloc, bIndex) => {
            const blockKey = `bloc-${bloc.numero}`;
            
            structure[unitKey].blocs[blockKey] = {
              id: bloc.numero,
              nom: bloc.nom,
              descripcio: bloc.descripcio,
              url: bloc.url,
              order: bIndex,
              noteCount: 0,
              seccions: {},
              isLoading: false
            };
            
            // Afegir seccions des de la configuració
            if (bloc.seccions && Array.isArray(bloc.seccions)) {
              bloc.seccions.forEach((seccio, index) => {
                structure[unitKey].blocs[blockKey].seccions[seccio.id] = {
                  id: seccio.id,
                  title: seccio.titol,
                  pageUrl: bloc.url,
                  notes: [],
                  order: index
                };
              });
              
              console.log(`✅ Discovery: ${bloc.seccions.length} seccions afegides a ${bloc.nom}`);
            }
          });
        }
      });
      
      // Fusionar amb notes existents per actualitzar comptadors
      return this._mergeWithNotes(structure);
    },


    _mergeWithNotes(baseStructure) {
      // Obtenir notes existents
      let existingNotes = [];
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        existingNotes = Object.values(state.notes.byId || {});
        
        // Debug: mostrar estructura completa de notes
        console.log('🔍 Discovery: Debugging notes storage:', {
          byIdCount: Object.keys(state.notes.byId || {}).length,
          bySectionKeys: Object.keys(state.notes.bySection || {}),
          totalCounter: state.notes.counters?.total || 0,
          fullNotesStructure: state.notes
        });
      }
      
      console.log(`🔍 Discovery: Fusionant amb ${existingNotes.length} notes existents`);
      if (existingNotes.length > 0) {
        console.log('🔍 Discovery: Notes trobades:', existingNotes.map(n => ({
          id: n.id,
          unitat: n.unitat,
          bloc: n.bloc,
          sectionId: n.sectionId
        })));
      }
      
      // Associar notes amb seccions
      existingNotes.forEach(note => {
        const unitKey = `unitat-${note.unitat}`;
        const blockKey = `bloc-${note.bloc}`;
        const sectionId = note.sectionId;
        
        console.log(`🔍 Discovery: Processant nota ${note.id}:`, {
          unitKey,
          blockKey,
          sectionId,
          existsUnit: !!baseStructure[unitKey],
          existsBlock: !!(baseStructure[unitKey] && baseStructure[unitKey].blocs[blockKey]),
          existsSection: !!(baseStructure[unitKey] && baseStructure[unitKey].blocs[blockKey] && baseStructure[unitKey].blocs[blockKey].seccions[sectionId])
        });
        
        if (baseStructure[unitKey] && 
            baseStructure[unitKey].blocs[blockKey] && 
            baseStructure[unitKey].blocs[blockKey].seccions[sectionId]) {
          
          // Afegir nota a la secció
          baseStructure[unitKey].blocs[blockKey].seccions[sectionId].notes.push(note);
          
          // Actualitzar comptadors
          baseStructure[unitKey].blocs[blockKey].noteCount++;
          baseStructure[unitKey].noteCount++;
          
          console.log(`✅ Discovery: Nota ${note.id} assignada correctament. Comptadors actualitzats:`, {
            unitNotes: baseStructure[unitKey].noteCount,
            blockNotes: baseStructure[unitKey].blocs[blockKey].noteCount
          });
        } else {
          console.warn('🟨 Discovery: Nota òrfena trobada:', note.id, {
            unitat: note.unitat,
            bloc: note.bloc,
            sectionId: note.sectionId,
            availableUnits: Object.keys(baseStructure),
            availableBlocks: baseStructure[unitKey] ? Object.keys(baseStructure[unitKey].blocs) : 'Unit not found',
            availableSections: (baseStructure[unitKey] && baseStructure[unitKey].blocs[blockKey]) ? 
              Object.keys(baseStructure[unitKey].blocs[blockKey].seccions) : 'Block not found'
          });
        }
      });
      
      return baseStructure;
    },

    // =============================
    // FALLBACK
    // =============================

    _fallbackToNotesStructure() {
      console.log('🔍 Discovery: Usant estructura basada només en notes (fallback)');
      
      // Retornar estructura simple basada només en notes existents
      let notes = [];
      if (window.Quadern && window.Quadern.Store) {
        const state = window.Quadern.Store.load();
        notes = Object.values(state.notes.byId || {});
      }
      
      const structure = {};
      
      notes.forEach(note => {
        const unitKey = `unitat-${note.unitat || '?'}`;
        const blockKey = `bloc-${note.bloc || '?'}`;
        
        if (!structure[unitKey]) {
          structure[unitKey] = {
            id: note.unitat || 0,
            nom: `Unitat ${note.unitat || '?'}`,
            descripcio: '',
            noteCount: 0,
            blocs: {}
          };
        }
        
        if (!structure[unitKey].blocs[blockKey]) {
          structure[unitKey].blocs[blockKey] = {
            id: note.bloc || 0,
            nom: `Bloc ${note.bloc || '?'}`,
            descripcio: '',
            url: note.pageUrl,
            noteCount: 0,
            seccions: {},
            isLoading: false
          };
        }
        
        const sectionId = note.sectionId || 'sense-seccio';
        if (!structure[unitKey].blocs[blockKey].seccions[sectionId]) {
          structure[unitKey].blocs[blockKey].seccions[sectionId] = {
            id: sectionId,
            title: note.sectionTitle || 'Sense títol',
            pageUrl: note.pageUrl,
            notes: [],
            order: 0
          };
        }
        
        structure[unitKey].blocs[blockKey].seccions[sectionId].notes.push(note);
        structure[unitKey].blocs[blockKey].noteCount++;
        structure[unitKey].noteCount++;
      });
      
      return structure;
    },

    // =============================
    // UTILITATS
    // =============================

    getCourseStructure() {
      return this.courseStructure;
    },

    getSectionsForBlock(unitId, blockId) {
      if (!this.courseStructure) return {};
      
      const unit = this.courseStructure[`unitat-${unitId}`];
      if (!unit) return {};
      
      const block = unit.blocs[`bloc-${blockId}`];
      if (!block) return {};
      
      return block.seccions || {};
    },

    getNotesForSection(unitId, blockId, sectionId) {
      const sections = this.getSectionsForBlock(unitId, blockId);
      const section = sections[sectionId];
      
      return section ? section.notes : [];
    },

    // Mètode per forçar refresh de seccions d'un bloc
    async refreshBlockSections(unitId, blockId) {
      if (!this.courseStructure) return;
      
      const unit = this.courseStructure[`unitat-${unitId}`];
      if (!unit) return;
      
      const block = unit.blocs[`bloc-${blockId}`];
      if (!block || !block.url) return;
      
      // Netejar cache
      this.sectionsCache.delete(block.url);
      
      // Re-detectar seccions
      await this._detectSectionsForBlock(block);
    },

    // Estadístiques d'estructura
    getStructureStats() {
      console.log('📊 Discovery: Calculant estadístiques. courseStructure:', !!this.courseStructure);
      
      if (!this.courseStructure) {
        console.warn('⚠️ Discovery: courseStructure no definit per estadístiques');
        return null;
      }
      
      const stats = {
        unitats: 0,
        blocs: 0,
        seccions: 0,
        notes: 0,
        seccionsAmbNotes: 0
      };
      
      console.log('📊 Discovery: Estructura disponible:', Object.keys(this.courseStructure));
      
      Object.values(this.courseStructure).forEach(unitat => {
        stats.unitats++;
        stats.notes += unitat.noteCount;
        console.log(`📊 Discovery: Processant unitat ${unitat.nom}, blocs:`, Object.keys(unitat.blocs));
        
        Object.values(unitat.blocs).forEach(bloc => {
          stats.blocs++;
          console.log(`📊 Discovery: Processant bloc ${bloc.nom}, seccions:`, Object.keys(bloc.seccions));
          
          Object.values(bloc.seccions).forEach(seccio => {
            stats.seccions++;
            if (seccio.notes.length > 0) {
              stats.seccionsAmbNotes++;
            }
          });
        });
      });
      
      console.log('📊 Discovery: Estadístiques finals:', stats);
      
      return stats;
    },

    // =============================
    // PERSISTÈNCIA
    // =============================

    _saveCourseToStorage(courseStructure) {
      try {
        if (!window.Quadern?.Store) {
          console.warn('🟨 Discovery: Store no disponible per guardar estructura');
          return;
        }

        const state = window.Quadern.Store.load();
        
        // Actualitzar informació del curs
        if (window.siteConfig) {
          // Format: cicle_modul_title
          const courseId = window.siteConfig ? 
            `${window.siteConfig.cicle_modul || 'DA2_Optativa'}_${window.siteConfig.title || 'Angular'}` : 
            'DA2_Optativa_Angular';
          
          state.course.id = courseId;
          state.course.title = window.siteConfig.title || 'Angular';
        }
        
        // Guardar estructura completa
        state.courseStructure = courseStructure;
        
        // Actualitzar metadades
        state.meta.updatedAt = new Date().toISOString();
        
        window.Quadern.Store.save(state);
        
        console.log('💾 Discovery: Estructura guardada al storage:', {
          courseId: state.course.id,
          unitats: Object.keys(courseStructure).length,
          totalBlocs: Object.values(courseStructure).reduce((acc, u) => acc + Object.keys(u.blocs).length, 0)
        });
        
      } catch (error) {
        console.error('❌ Discovery: Error guardant estructura:', error);
      }
    },

    loadCourseFromStorage() {
      try {
        if (!window.Quadern?.Store) return null;
        
        const state = window.Quadern.Store.load();
        if (state.courseStructure) {
          this.courseStructure = state.courseStructure;
          console.log('📖 Discovery: Estructura carregada del storage. Unitats:', Object.keys(state.courseStructure).length);
          console.log('📖 Discovery: this.courseStructure assignat:', !!this.courseStructure);
          return state.courseStructure;
        }
        
        return null;
      } catch (error) {
        console.error('❌ Discovery: Error carregant estructura del storage:', error);
        return null;
      }
    }
  };

  // Exposar al namespace
  window.Quadern = window.Quadern || {};
  window.Quadern.Discovery = Discovery;

})();
