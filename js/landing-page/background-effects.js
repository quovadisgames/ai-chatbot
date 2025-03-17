// Background Effects for Landing Page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we should initialize effects here or let effects-toggle.js handle it
    if (typeof initEffectsToggle !== 'function') {
        // If effects-toggle.js is not loaded, initialize effects directly
        // Always create particles and waves for the "None" effect
        createParticles();
        createWaves();
    }
    
    // Recreate effects on window resize
    window.addEventListener('resize', function() {
        // Recreate particles and waves on resize
        createParticles();
        createWaves();
    });
});

// Create particles for hero section
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) {
        console.warn('Particles container not found');
        return;
    }
    
    particlesContainer.innerHTML = '';
    
    // Determine particle count and style based on theme
    let particleCount = 30;
    let particleColor, particleOpacity, particleSize;
    
    // Get current theme
    const currentTheme = localStorage.getItem('pdtAiTheme') || 'kotor';
    
    if (currentTheme === 'kotor') {
        particleCount = 35;
        particleColor = '#00BFFF';
        particleOpacity = 0.45;
        particleSize = 4;
    } else if (currentTheme === 'jedi') {
        particleCount = 40;
        particleColor = '#00D4FF';
        particleOpacity = 0.35;
        particleSize = 3.5;
    } else if (currentTheme === 'professional') {
        particleCount = 32;
        particleColor = '#0078D4';
        particleOpacity = 0.28;
        particleSize = 2.5;
    }
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Apply theme-specific styling
        particle.style.backgroundColor = particleColor;
        particle.style.opacity = particleOpacity;
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.boxShadow = `0 0 ${particleSize * 2}px ${particleColor}`;
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        
        // Random drift direction and speed
        const xDrift = (Math.random() - 0.5) * 400;
        const yDrift = (Math.random() - 0.5) * 400;
        particle.style.setProperty('--x-drift', `${xDrift}px`);
        particle.style.setProperty('--y-drift', `${yDrift}px`);
        
        // Random animation duration
        const duration = 2 + Math.random() * 5;
        particle.style.setProperty('--drift-duration', `${duration}s`);
        
        // Random delay
        const delay = Math.random() * 5;
        particle.style.animationDelay = `${delay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Add wave effect to the hero section
function createWaves() {
    const wavesContainer = document.getElementById('waves-container');
    if (!wavesContainer) {
        console.warn('Waves container not found');
        return;
    }
    
    wavesContainer.innerHTML = '';
    
    // Create 3 wave layers
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = `wave wave-${i+1}`;
        wavesContainer.appendChild(wave);
    }
    
    // Update wave colors based on theme
    updateWaveColors(localStorage.getItem('pdtAiTheme') || 'kotor');
}

// Update wave colors based on theme
function updateWaveColors(theme) {
    const waves = document.querySelectorAll('.wave');
    if (waves.length === 0) {
        return;
    }
    
    let waveColor;
    
    if (theme === 'kotor') {
        waveColor = 'rgba(var(--kotor-accent-rgb, 0, 191, 255), ';
    } else if (theme === 'jedi') {
        waveColor = 'rgba(var(--jedi-accent-rgb, 0, 212, 255), ';
    } else {
        waveColor = 'rgba(var(--prof-accent-rgb, 0, 120, 212), ';
    }
    
    waves.forEach((wave, index) => {
        const opacity = 0.09 - (index * 0.015);
        wave.style.background = `${waveColor}${opacity})`;
    });
} 