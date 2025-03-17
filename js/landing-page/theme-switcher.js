// Theme Switcher for Landing Page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme from localStorage or default to KOTOR
    initThemeSwitcher();
});

function initThemeSwitcher() {
    const savedTheme = localStorage.getItem('pdtAiTheme') || 'kotor';
    setTheme(savedTheme);
    
    const themeSwitcher = document.querySelector('.theme-switcher');
    const themeButton = document.querySelector('.theme-switcher-button');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Toggle dropdown
    themeButton.addEventListener('click', function() {
        themeSwitcher.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!themeSwitcher.contains(event.target)) {
            themeSwitcher.classList.remove('active');
        }
    });
    
    // Theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme);
            themeSwitcher.classList.remove('active');
        });
    });
}

function setTheme(theme) {
    // Create transition overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = theme === 'kotor' ? '#00BFFF' : 
                                   theme === 'jedi' ? '#00D4FF' : '#0078D4';
    overlay.style.zIndex = '9999';
    overlay.style.transformOrigin = 'left';
    overlay.style.transform = 'scaleX(0)';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    document.body.appendChild(overlay);
    
    // Animate the overlay
    overlay.animate([
        { transform: 'scaleX(0)', opacity: 0.3 },
        { transform: 'scaleX(1)', opacity: 0.3 },
        { transform: 'scaleX(1)', opacity: 0 }
    ], {
        duration: 500,
        easing: 'ease-in-out'
    }).onfinish = function() {
        overlay.remove();
    };
    
    // Remove all theme classes
    document.body.classList.remove('kotor-theme', 'jedi-theme', 'professional-theme');
    
    // Add selected theme class
    document.body.classList.add(`${theme}-theme`);
    
    // Update current theme text
    document.querySelector('.current-theme').textContent = 
        theme === 'kotor' ? 'KOTOR' : 
        theme === 'jedi' ? 'Jedi: Survivor' : 
        'Professional';
    
    // Save to localStorage
    localStorage.setItem('pdtAiTheme', theme);
    
    // Update background elements
    // Recreate particles with theme-specific styling
    if (typeof createParticles === 'function') {
        createParticles();
    }
    
    // Update wave colors based on theme
    if (typeof updateWaveColors === 'function') {
        updateWaveColors(theme);
    }
} 