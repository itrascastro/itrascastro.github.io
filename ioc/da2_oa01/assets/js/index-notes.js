;(function(){
  // Bootstrap del nou panell de notes (no s'inicialitza automàticament a cap layout existent)
  function initNotesPanel(){
    if (!window.Quadern || !window.Quadern.Panel) return;
    const panel = new window.Quadern.Panel();
    panel.init();
    // Expose per a depuració manual a consola
    window.Quadern._panel = panel;
  }
  // No auto-exec — el layout actual no referencia aquest fitxer.
  // Quan es decideixi, es pot cridar manualment initNotesPanel() des de consola.
  window.Quadern = window.Quadern || {};
  window.Quadern.bootstrapNotes = initNotesPanel;
})();

