// JavaScript EXACTE de la plantilla de referència
// Implementació completa i funcional

// Gestió del dropdown de navegació
function initializeNavDropdown() {
    const dropdown = document.getElementById('nav-dropdown');
    const btn = document.getElementById('nav-dropdown-btn');
    
    if (!dropdown || !btn) return;
    
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    
    // Tancar en clicar fora
    document.addEventListener('click', function() {
        dropdown.classList.remove('open');
    });
    
    // Evitar tancar en clicar dins del dropdown
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}


// Funcions d'inicialització MÍNIMES
document.addEventListener('DOMContentLoaded', function() {
    initializeThemeToggle();
    initializeNavDropdown();
});

// Assegurar posició 0,0 inicial
window.addEventListener('load', function() {
    window.scrollTo(0, 0);
});

// Gestió del tema fosc/clar
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (!themeToggle) return;
    
    // Cargar tema guardat
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? 'Mode Clar' : 'Mode Fosc';
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? 'Mode Clar' : 'Mode Fosc';
    });
}

// Navegació suau amb offset per header fix
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            const headerHeight = 70;
            const additionalOffset = 20;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - additionalOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
