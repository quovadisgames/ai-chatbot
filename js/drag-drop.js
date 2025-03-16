// Simplified Persona Management
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const personaCards = document.querySelectorAll('.persona-card');
    const activePersonas = document.getElementById('active-personas');
    const participantsCount = document.querySelector('.participants-count');
    const premiumPersonasHeader = document.querySelector('.premium-personas-header');
    const premiumPersonasSection = document.querySelector('.premium-personas-section');
    
    // Initialize
    initPersonaSelection();
    initPremiumPersonasToggle();
    
    // Persona Selection Initialization
    function initPersonaSelection() {
        // Remove any existing highlights from Support Bot
        const supportBot = document.querySelector('.persona-card[data-persona-id="support-bot"]');
        if (supportBot) {
            supportBot.classList.remove('active');
        }
        
        // Add click event to persona cards
        personaCards.forEach(card => {
            card.addEventListener('click', handlePersonaClick);
        });
    }
    
    // Initialize Premium Personas Toggle
    function initPremiumPersonasToggle() {
        if (premiumPersonasHeader) {
            premiumPersonasHeader.addEventListener('click', function() {
                premiumPersonasSection.classList.toggle('expanded');
                const toggleIcon = this.querySelector('.premium-personas-toggle svg');
                if (toggleIcon) {
                    toggleIcon.style.transform = premiumPersonasSection.classList.contains('expanded') 
                        ? 'rotate(180deg)' 
                        : 'rotate(0deg)';
                }
            });
        }
    }
    
    // Event Handlers
    function handlePersonaClick() {
        const personaId = this.getAttribute('data-persona-id');
        const personaName = this.querySelector('.persona-name').textContent;
        const personaAvatar = this.querySelector('.avatar-image')?.getAttribute('src') || '';
        
        // Toggle active state
        this.classList.toggle('active');
        
        if (this.classList.contains('active')) {
            // Add to active personas if not already there
            if (!document.querySelector(`.participant-chip[data-persona-id="${personaId}"]`)) {
                addPersonaToChat(personaId, personaName, personaAvatar);
                showNotification(`${personaName} added to chat`);
            }
        } else {
            // Remove from active personas
            const existingChip = document.querySelector(`.participant-chip[data-persona-id="${personaId}"]`);
            if (existingChip) {
                existingChip.remove();
                updateParticipantCount();
                showNotification(`${personaName} removed from chat`);
            }
        }
    }
    
    // Helper Functions
    function addPersonaToChat(personaId, personaName, personaAvatar) {
        // Create participant chip
        const participantChip = document.createElement('div');
        participantChip.className = 'participant-chip';
        participantChip.setAttribute('data-persona-id', personaId);
        
        participantChip.innerHTML = `
            <img src="${personaAvatar}" alt="${personaName}" class="chip-avatar">
            <span class="chip-name">${personaName}</span>
            <button type="button" class="chip-remove" aria-label="Remove ${personaName}">×</button>
        `;
        
        // Add event listener to remove button
        const removeButton = participantChip.querySelector('.chip-remove');
        removeButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            
            // Remove chip
            participantChip.remove();
            
            // Update participant count
            updateParticipantCount();
            
            // Remove active state from persona card
            const personaCard = document.querySelector(`.persona-card[data-persona-id="${personaId}"]`);
            if (personaCard) {
                personaCard.classList.remove('active');
            }
            
            showNotification(`${personaName} removed from chat`);
        });
        
        // Add to active personas
        if (activePersonas) {
            activePersonas.appendChild(participantChip);
            updateParticipantCount();
        }
    }
    
    function updateParticipantCount() {
        if (!activePersonas || !participantsCount) return;
        
        const count = activePersonas.querySelectorAll('.participant-chip').length;
        participantsCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
    }
    
    function showNotification(message) {
        // Use the Notifications system if available
        if (window.Notifications) {
            window.Notifications.info(message);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}); 