// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat application initialized');
    
    // This file serves as the entry point for the chat application
    // All functionality is modularized into separate files:
    // - theme-switcher.js: Handles theme switching functionality
    // - chat-rules.js: Manages the chat rules modal
    // - chat-input.js: Handles chat input, sending messages, and AI responses
    // - sidebar-toggle.js: Controls the sidebar toggle functionality
    // - drag-drop.js: Manages drag and drop functionality for personas
    // - background-effects.js: Creates and manages background visual effects
    
    // Add a global debug function
    window.debugElements = function() {
        // Get sidebar elements
        const historySidebar = document.querySelector('.history-sidebar');
        const personasSidebar = document.querySelector('.personas-sidebar');
        const chatContainer = document.querySelector('.chat-container');
        
        // Get all toggle buttons
        const historyToggleInSidebar = document.querySelector('.history-sidebar .sidebar-toggle');
        const personasToggleInSidebar = document.querySelector('.personas-sidebar .sidebar-toggle');
        const historyPersistentToggle = document.querySelector('.persistent-toggle.history-toggle');
        const personasPersistentToggle = document.querySelector('.persistent-toggle.personas-toggle');
        
        // Log element states
        console.log('Element States:', {
            historySidebar: {
                exists: !!historySidebar,
                classes: historySidebar ? historySidebar.className : 'N/A',
                width: historySidebar ? window.getComputedStyle(historySidebar).width : 'N/A'
            },
            personasSidebar: {
                exists: !!personasSidebar,
                classes: personasSidebar ? personasSidebar.className : 'N/A',
                width: personasSidebar ? window.getComputedStyle(personasSidebar).width : 'N/A'
            },
            chatContainer: {
                exists: !!chatContainer,
                classes: chatContainer ? chatContainer.className : 'N/A',
                marginLeft: chatContainer ? window.getComputedStyle(chatContainer).marginLeft : 'N/A',
                marginRight: chatContainer ? window.getComputedStyle(chatContainer).marginRight : 'N/A'
            },
            toggleButtons: {
                historyToggleInSidebar: !!historyToggleInSidebar,
                personasToggleInSidebar: !!personasToggleInSidebar,
                historyPersistentToggle: !!historyPersistentToggle,
                personasPersistentToggle: !!personasPersistentToggle
            }
        });
        
        return 'Debug information logged to console';
    };
    
    // Log initial state
    setTimeout(window.debugElements, 500);
}); 