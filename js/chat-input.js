// Chat Input Functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.querySelector('.chat-messages');
    const activePersonas = document.getElementById('active-personas');
    
    // Initialize chat input
    initChatInput();
    
    // Initialize active personas
    initActivePersonas();
    
    // Initialize the ribbon actions
    initRibbonActions();
    
    function initChatInput() {
        if (!chatInput || !sendButton) return;
        
        // Auto-resize textarea as user types
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Enable/disable send button based on input
            sendButton.disabled = !this.value.trim();
        });
        
        // Handle send message
        sendButton.addEventListener('click', sendMessage);
        
        // Allow Enter to send (Shift+Enter for new line)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    function sendMessage() {
        if (!chatInput.value.trim()) return;
        
        // Get active personas
        const personas = Array.from(activePersonas.querySelectorAll('.participant-chip'))
            .map(chip => ({
                name: chip.querySelector('.chip-name').textContent,
                avatar: chip.querySelector('.chip-avatar').src
            }));
        
        if (personas.length === 0) {
            showNotification('Please add at least one persona to chat with', 'warning');
            return;
        }
        
        // Add user message
        addMessage({
            content: chatInput.value,
            isUser: true,
            timestamp: new Date()
        });
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;
        
        // Show typing indicator
        showTypingIndicator(personas[0]);
        
        // Simulate AI response after a delay
        setTimeout(() => {
            hideTypingIndicator();
            
            // Add AI response
            addMessage({
                content: generateResponse(chatInput.value),
                sender: personas[0].name,
                avatar: personas[0].avatar,
                isUser: false,
                timestamp: new Date()
            });
        }, 1500 + Math.random() * 1500);
    }
    
    function addMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.isUser ? 'user-message' : 'ai-message'}`;
        
        let avatarHTML = '';
        if (!message.isUser && message.avatar) {
            avatarHTML = `<img src="${message.avatar}" alt="${message.sender}" class="message-avatar">`;
        }
        
        let senderHTML = '';
        if (!message.isUser && message.sender) {
            senderHTML = `<div class="message-sender">${message.sender}</div>`;
        }
        
        const formattedTime = formatTime(message.timestamp);
        
        messageEl.innerHTML = `
            ${avatarHTML}
            <div class="message-content">
                ${senderHTML}
                <div class="message-text">${formatMessageContent(message.content)}</div>
                <div class="message-meta">
                    <span class="message-time">${formattedTime}</span>
                    ${!message.isUser ? '<div class="message-actions">'+
                        '<button class="action-button copy-button" aria-label="Copy message"><i class="fas fa-copy"></i></button>'+
                        '<button class="action-button regenerate-button" aria-label="Regenerate response"><i class="fas fa-redo-alt"></i></button>'+
                    '</div>' : ''}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageEl);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add event listeners for message actions
        if (!message.isUser) {
            const copyButton = messageEl.querySelector('.copy-button');
            if (copyButton) {
                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(message.content)
                        .then(() => showNotification('Message copied to clipboard', 'success'))
                        .catch(() => showNotification('Failed to copy message', 'error'));
                });
            }
        }
    }
    
    function formatMessageContent(content) {
        // Check for code blocks
        const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
        let formattedContent = content.replace(codeBlockRegex, (match, language, code) => {
            return `<div class="code-block-container">
                <div class="code-block-header">
                    <span class="code-language">${language || 'code'}</span>
                    <button class="code-block-button copy-code" aria-label="Copy code">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="code-block-button expand-code" aria-label="Expand code">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
                <pre class="code-block"><code class="${language}">${escapeHTML(code)}</code></pre>
            </div>`;
        });
        
        // Convert line breaks to <br>
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        return formattedContent;
    }
    
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function showTypingIndicator(persona) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator-container';
        typingIndicator.innerHTML = `
            <img src="${persona.avatar}" alt="${persona.name}" class="typing-avatar">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    function initActivePersonas() {
        // Add default personas
        const defaultPersonas = [
            { name: 'Jedi Master Zex', avatar: 'avatars/jedi-master.svg' }
        ];
        
        defaultPersonas.forEach(persona => {
            addPersonaChip(persona);
        });
        
        // Handle removing personas
        activePersonas.addEventListener('click', function(e) {
            if (e.target.classList.contains('chip-remove') || e.target.parentElement.classList.contains('chip-remove')) {
                const chip = e.target.closest('.participant-chip');
                if (chip) {
                    chip.remove();
                }
            }
        });
    }
    
    function addPersonaChip(persona) {
        const chip = document.createElement('div');
        chip.className = 'participant-chip';
        chip.innerHTML = `
            <img src="${persona.avatar}" alt="${persona.name}" class="chip-avatar">
            <span class="chip-name">${persona.name}</span>
            <button class="chip-remove" aria-label="Remove ${persona.name}">×</button>
        `;
        activePersonas.appendChild(chip);
    }
    
    function initRibbonActions() {
        // Initialize token display
        updateTokenDisplay(0);
        
        // Initialize ribbon buttons
        const clearChatButton = document.querySelector('.clear-chat-button');
        if (clearChatButton) {
            clearChatButton.addEventListener('click', () => {
                chatMessages.innerHTML = '';
                showNotification('Chat cleared', 'success');
            });
        }
        
        const optimizeButton = document.querySelector('.optimize-button');
        if (optimizeButton) {
            optimizeButton.addEventListener('click', () => {
                showNotification('Optimizing conversation...', 'success');
                // Simulate optimization
                setTimeout(() => {
                    updateTokenDisplay(Math.floor(Math.random() * 1000));
                    showNotification('Conversation optimized!', 'success');
                }, 1500);
            });
        }
    }
    
    function updateTokenDisplay(tokenCount) {
        const tokenDisplay = document.querySelector('.token-count');
        const tokenProgress = document.querySelector('.token-progress-bar');
        
        if (tokenDisplay && tokenProgress) {
            const maxTokens = 4000;
            const percentage = Math.min((tokenCount / maxTokens) * 100, 100);
            
            tokenDisplay.textContent = `${tokenCount}/${maxTokens}`;
            tokenProgress.style.width = `${percentage}%`;
            
            // Update color based on usage
            if (percentage > 90) {
                tokenProgress.style.backgroundColor = 'var(--color-error)';
            } else if (percentage > 70) {
                tokenProgress.style.backgroundColor = 'var(--color-warning)';
            } else {
                tokenProgress.style.backgroundColor = 'var(--current-accent)';
            }
        }
    }
    
    function generateResponse(userMessage) {
        // Simple response generation for demo purposes
        const responses = [
            "I understand your point about that. Let me elaborate further...",
            "That's an interesting perspective. Have you considered...",
            "Based on my analysis, I would recommend...",
            "Let me process that information and provide a detailed response...",
            "According to my knowledge, the best approach would be..."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)] + 
            "\n\nHere's an example code:\n```javascript\nfunction example() {\n  const data = fetchData();\n  return data.map(item => item.value * 2);\n}\n```";
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}); 