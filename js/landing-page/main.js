// Main JavaScript file for Landing Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page initialized');
    
    // This file serves as the entry point for the landing page
    // All functionality is modularized into separate files:
    // - theme-switcher.js: Handles theme switching functionality
    // - carousel.js: Manages the showcase carousel
    // - background-effects.js: Creates and manages background visual effects
    
    // Add any landing page specific initialization here
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        featureCards.forEach(card => {
            observer.observe(card);
        });
    }
}); 