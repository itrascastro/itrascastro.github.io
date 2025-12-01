;(function(){
  const SITE_ID = (function(){
    try {
      const base = document.body.getAttribute('data-baseurl') || '';
      const title = (window.siteConfig && window.siteConfig.title) ? `:${window.siteConfig.title}` : '';
      return (location.origin || 'local') + base + title;
    }
    catch { return 'local'; }
  })();
  window.Quadern = window.Quadern || {};
  window.Quadern.Constants = {
    STORE_KEY: `quadern-app:${SITE_ID}`,
    SCHEMA_VERSION: 1,
  };
})();
