;(function(){
  function slugify(text){
    return String(text||'')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}+/gu,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }
  function uid(prefix){ return (prefix||'n') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function nowISO(){ return new Date().toISOString(); }
  function timeAgo(iso){ try{ const d=new Date(iso); const s=((Date.now()-d.getTime())/1000)|0; if(s<60)return s+'s'; const m=(s/60)|0; if(m<60)return m+'m'; const h=(m/60)|0; if(h<24)return h+'h'; const dd=(h/24)|0; return dd+'d'; } catch { return ''; } }
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }
  window.Quadern = window.Quadern || {};
  window.Quadern.Utils = { slugify, uid, nowISO, timeAgo, $, $all };
})();

