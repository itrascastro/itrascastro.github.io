;(function(){
  const { STORE_KEY, SCHEMA_VERSION } = window.Quadern.Constants || {};
  const U = window.Quadern.Utils;

  const LEGACY_KEY = (function(){
    try {
      const base = document.body.getAttribute('data-baseurl') || '';
      return `quadern-app:${(location.origin || 'local')}${base}`;
    } catch {
      return null;
    }
  })();

  function initialState(){
    return {
      schemaVersion: SCHEMA_VERSION || 1,
      meta: { createdAt: U.nowISO(), updatedAt: U.nowISO(), appVersion: '0.1.0' },
      course: { id: '', title: '' },
      user: { theme: 'light', language: 'ca', lastView: 'study', mode: 'study' },
      ui: { explorer: { openUnits: [], openBlocs: {} }, notesPanel: { open: false, sectionId: '', noteId: '' } },
      progress: { lastVisited: null, readPositions: {}, sections: {} },
      filters: { q: '', tags: [] },
      notes: { byId: {}, bySection: {}, orderBySection: {}, counters: { total: 0 } }
    };
  }
  function load(){
    try {
      let raw = localStorage.getItem(STORE_KEY);
      let legacyData = null;

      // Llegir possible clau antiga
      if (LEGACY_KEY) {
        const legacyRaw = localStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
          try { legacyData = JSON.parse(legacyRaw); } catch(e){}
        }
      }

      // Si no hi ha clau nova, però sí antiga, migrar
      if (!raw && legacyData) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(legacyData)); raw = JSON.stringify(legacyData); } catch(e){}
      }

      if (!raw) return initialState();
      let data = JSON.parse(raw);

      // Si la clau nova està buida (sense notes) però la clau antiga té dades, migrar-les
      const newNotesCount = (data && data.notes && data.notes.byId) ? Object.keys(data.notes.byId).length : 0;
      const legacyNotesCount = (legacyData && legacyData.notes && legacyData.notes.byId) ? Object.keys(legacyData.notes.byId).length : 0;
      if (legacyData && legacyNotesCount > 0 && newNotesCount === 0) {
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(legacyData));
          data = legacyData;
        } catch(e){}
      }

      data = migrateLegacyPreferences(data);

      return data && typeof data==='object' ? data : initialState();
    }
    catch { return initialState(); }
  }
  // Migració de preferències/altres claus externes cap al Store únic
  function migrateLegacyPreferences(state){
    if (!state || typeof state !== 'object') return initialState();
    try {
      // Theme (antigues 'theme', 'notes_theme', STORE_KEY:theme)
      const themeKeys = ['theme','notes_theme', `${STORE_KEY}:theme`];
      for (const k of themeKeys){
        const t = localStorage.getItem(k);
        if (t === 'dark' || t === 'light') {
          state.user = state.user || {};
          state.user.theme = t;
        }
        try { localStorage.removeItem(k); } catch(e){}
      }
      // Mode d'estudi
      const sm = localStorage.getItem('notes_study_mode');
      if (sm !== null) {
        state.user = state.user || {};
        state.user.mode = sm === '1' ? 'study' : 'dashboard';
      }
      try { localStorage.removeItem('notes_study_mode'); } catch(e){}
      // Bookmark
      const bmRaw = localStorage.getItem('quadern_bookmark');
      if (bmRaw) {
        try {
          const bm = JSON.parse(bmRaw);
          state.ui = state.ui || {};
          state.ui.bookmark = bm;
        } catch(e){}
      }
      try { localStorage.removeItem('quadern_bookmark'); } catch(e){}
    } catch(e){}
    return state;
  }
  function save(state){
    try {
      state.meta.updatedAt = U.nowISO();
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      // Notify UI to refresh footer stats immediately after any storage change
      try { if (window.Quadern?.App?._updateFooterStats) window.Quadern.App._updateFooterStats(); } catch(e){}
    } catch {}
  }

  function sectionKey(pageUrl, sectionId){ return `${pageUrl}#${sectionId}`; }

  function upsertNote(state, note){
    const n = Object.assign({}, note);
    if (!n.id) n.id = U.uid('note');
    state.notes.byId[n.id] = n;
    const sKey = sectionKey(n.pageUrl, n.sectionId);
    const arr = state.notes.bySection[sKey] || (state.notes.bySection[sKey] = []);
    if (!arr.includes(n.id)) arr.push(n.id);
    // Ensure custom order includes the new id at the end if order exists
    if (state.notes.orderBySection && Array.isArray(state.notes.orderBySection[sKey])) {
      const ord = state.notes.orderBySection[sKey];
      if (!ord.includes(n.id)) ord.push(n.id);
    }
    state.notes.counters.total = Object.keys(state.notes.byId).length;
    return n;
  }
  function deleteNote(state, id){
    const note = state.notes.byId[id]; if (!note) return;
    delete state.notes.byId[id];
    const sKey = sectionKey(note.pageUrl, note.sectionId);
    const arr = state.notes.bySection[sKey] || [];
    state.notes.bySection[sKey] = arr.filter(x => x !== id);
    state.notes.counters.total = Object.keys(state.notes.byId).length;
  }
  function notesForSection(state, pageUrl, sectionId){
    const sKey = sectionKey(pageUrl, sectionId);
    const ids = state.notes.bySection[sKey] || [];
    return ids.map(id => state.notes.byId[id]).filter(Boolean);
  }
  function getOrderForSection(state, pageUrl, sectionId){
    const sKey = sectionKey(pageUrl, sectionId);
    const custom = state.notes.orderBySection && state.notes.orderBySection[sKey];
    if (Array.isArray(custom) && custom.length) return custom.slice();
    // Default: order by createdAt ASC
    const arr = (state.notes.bySection[sKey] || []).slice();
    arr.sort((aId,bId)=>{
      const a = state.notes.byId[aId]||{}; const b = state.notes.byId[bId]||{};
      return new Date(a.createdAt||a.updatedAt||0) - new Date(b.createdAt||b.updatedAt||0);
    });
    return arr;
  }
  function setOrderForSection(state, pageUrl, sectionId, orderedIds){
    const sKey = sectionKey(pageUrl, sectionId);
    const ids = state.notes.bySection[sKey] || [];
    // keep only ids present in section and maintain order of provided array
    const set = new Set(ids);
    const cleaned = orderedIds.filter(id => set.has(id));
    // append any missing ids at end preserving default order
    const missing = ids.filter(id => !cleaned.includes(id));
    state.notes.orderBySection[sKey] = cleaned.concat(missing);
  }
  function countForSection(state, pageUrl, sectionId){
    const sKey = sectionKey(pageUrl, sectionId);
    const arr = state.notes.bySection[sKey] || [];
    return arr.length;
  }

  window.Quadern = window.Quadern || {};
  window.Quadern.Store = { load, save, upsertNote, deleteNote, notesForSection, countForSection, getOrderForSection, setOrderForSection };
})();
