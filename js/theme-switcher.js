// Theme Switcher Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const themeSwitcherButton = document.querySelector('.theme-switcher-button');
    const themeOptions = document.querySelectorAll('.theme-option');
    const currentThemeSpan = document.querySelector('.current-theme');
    
    // Toggle theme dropdown
    themeSwitcherButton.addEventListener('click', function() {
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
        });
    });
    
    // Set theme function
    function setTheme(theme) {
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
        
        // Apply theme after a short delay for transition effect
        setTimeout(() => {
            document.body.className = theme + '-theme';
            
            // Update current theme text
            if (theme === 'kotor') {
                currentThemeSpan.textContent = 'KOTOR';
            } else if (theme === 'jedi') {
                currentThemeSpan.textContent = 'Jedi: Survivor';
            } else if (theme === 'professional') {
                currentThemeSpan.textContent = 'Professional';
            }
            
            // Save theme preference
            localStorage.setItem('pdtAiTheme', theme);
            
            // Close dropdown
            themeSwitcher.classList.remove('active');
            
            // If we have background effects functions, update them
            if (typeof createParticles === 'function') {
                createParticles();
            }
            
            if (typeof createWaves === 'function') {
                createWaves();
            }
            
            // Remove overlay after transition
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }, 50);
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('pdtAiTheme') || 'kotor';
    setTheme(savedTheme);
}); 