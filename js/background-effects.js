// Background Visual Effects
document.addEventListener('DOMContentLoaded', function() {
    // Neural network nodes
    function createNeuralNodes() {
        const container = document.getElementById('neural-nodes');
        if (!container) return;
        
        container.innerHTML = '';
        const width = window.innerWidth;
        const height = window.innerHeight;
        const nodeCount = Math.floor((width * height) / 15000);
        
        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'neural-node';
            node.style.left = `${Math.random() * 100}%`;
            node.style.top = `${Math.random() * 100}%`;
            node.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(node);
        }
    }
    
    // Particles
    function createParticles() {
        const container = document.querySelector('.particles');
        if (!container) return;
        
        container.innerHTML = '';
        const width = window.innerWidth;
        const height = window.innerHeight;
        const particleCount = Math.floor((width * height) / 10000);
        
        // Get current theme for particle colors
        const currentTheme = localStorage.getItem('pdtAiTheme') || 'kotor';
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${5 + Math.random() * 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(particle);
        }
    }
    
    // Waves
    function createWaves() {
        const container = document.querySelector('.waves-container');
        if (!container) return;
        
        container.innerHTML = '';
        const waveCount = 3;
        
        for (let i = 0; i < waveCount; i++) {
            const wave = document.createElement('div');
            wave.className = 'wave';
            wave.style.animationDelay = `${i * 0.5}s`;
            wave.style.bottom = `${i * 10}px`;
            container.appendChild(wave);
        }
    }
    
    // Make functions globally available
    window.createNeuralNodes = createNeuralNodes;
    window.createParticles = createParticles;
    window.createWaves = createWaves;
    
    // Initialize background effects
    createNeuralNodes();
    createParticles();
    createWaves();
    
    // Resize handler
    window.addEventListener('resize', function() {
        createNeuralNodes();
        createParticles();
        createWaves();
    });
}); 