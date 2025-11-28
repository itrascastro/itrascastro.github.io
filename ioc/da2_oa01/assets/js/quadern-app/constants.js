;(function(){
  const SITE_ID = (function(){
    try { return (location.origin || 'local') + (document.body.getAttribute('data-baseurl') || ''); }
    catch { return 'local'; }
  })();
  window.Quadern = window.Quadern || {};
  window.Quadern.Constants = {
    STORE_KEY: `quadern-app:${SITE_ID}`,
    SCHEMA_VERSION: 1,
  };
})();

