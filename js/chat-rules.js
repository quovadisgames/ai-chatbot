// Chat Rules Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const rulesButton = document.querySelector('.rules-button');
    const chatRulesModal = document.querySelector('.chat-rules-modal');
    const closeButton = document.querySelector('.close-button');
    const applyButton = document.querySelector('.apply-button');
    const ruleOptions = document.querySelectorAll('.rule-option');
    const creativitySlider = document.querySelector('.creativity-slider');
    
    // Toggle rules modal
    rulesButton.addEventListener('click', function() {
        chatRulesModal.style.display = chatRulesModal.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close modal
    closeButton.addEventListener('click', function() {
        chatRulesModal.style.display = 'none';
    });
    
    // Apply rules
    applyButton.addEventListener('click', function() {
        chatRulesModal.style.display = 'none';
        // In a real app, this would apply the selected rules
    });
    
    // Rule option selection
    ruleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from siblings
            const siblings = Array.from(this.parentNode.children);
            siblings.forEach(sibling => sibling.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });
    
    // Creativity slider
    creativitySlider.addEventListener('input', function() {
        const value = this.value;
        this.parentNode.querySelector('label').textContent = `Creativity: ${value}%`;
    });
}); 