// Effects Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    initEffectsToggle();
});

// Available effect types
const EFFECT_TYPES = {
    NONE: 'none'
    // Additional effect types can be added here in the future
};

// Initialize effects toggle
function initEffectsToggle() {
    const effectsToggle = document.querySelector('.effects-toggle');
    const effectsButton = document.querySelector('.effects-toggle-button');
    const effectOptions = document.querySelectorAll('.effect-option');
    
    if (!effectsToggle || !effectsButton) {
        console.warn('Effects toggle elements not found');
        return;
    }
    
    // Set initial effect from localStorage or default to none
    const savedEffect = localStorage.getItem('pdtAiEffect') || EFFECT_TYPES.NONE;
    setEffect(savedEffect);
    
    // Update current effect text
    updateEffectText(savedEffect);
    
    // Toggle dropdown
    effectsButton.addEventListener('click', function() {
        effectsToggle.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!effectsToggle.contains(event.target)) {
            effectsToggle.classList.remove('active');
        }
    });
    
    // Effect selection
    effectOptions.forEach(option => {
        option.addEventListener('click', function() {
            const effect = this.getAttribute('data-effect');
            setEffect(effect);
            updateEffectText(effect);
            effectsToggle.classList.remove('active');
        });
    });
}

// Set the active effect
function setEffect(effectType) {
    // Save to localStorage
    localStorage.setItem('pdtAiEffect', effectType);
    
    // Apply the selected effect
    applyEffect(effectType);
}

// Update the effect button text
function updateEffectText(effectType) {
    const currentEffectSpan = document.querySelector('.current-effect');
    if (currentEffectSpan) {
        currentEffectSpan.textContent = 'None';
    }
}

// Apply the selected effect
function applyEffect(effectType) {
    // Clear existing background elements
    clearBackgroundElements();
    
    // For now, we only have the "None" effect which shows particles and waves
    createParticles();
    createWaves();
}

// Clear background elements
function clearBackgroundElements() {
    const nodesContainer = document.getElementById('neural-nodes');
    if (nodesContainer) {
        nodesContainer.innerHTML = '';
    }
    
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        particlesContainer.innerHTML = '';
    }
    
    const wavesContainer = document.getElementById('waves-container');
    if (wavesContainer) {
        wavesContainer.innerHTML = '';
    }
} 