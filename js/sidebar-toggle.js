// Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get sidebar elements
    const historySidebar = document.querySelector('.history-sidebar');
    const personasSidebar = document.querySelector('.personas-sidebar');
    const chatContainer = document.querySelector('.chat-container');
    
    // Get all toggle buttons
    const historyToggleInSidebar = document.querySelector('.history-sidebar .sidebar-toggle');
    const personasToggleInSidebar = document.querySelector('.personas-sidebar .sidebar-toggle');
    const historyPersistentToggle = document.querySelector('.persistent-toggle.history-toggle');
    const personasPersistentToggle = document.querySelector('.persistent-toggle.personas-toggle');
    
    // Debug element existence
    console.log('Elements found:', {
        historySidebar: !!historySidebar,
        personasSidebar: !!personasSidebar,
        chatContainer: !!chatContainer,
        historyToggleInSidebar: !!historyToggleInSidebar,
        personasToggleInSidebar: !!personasToggleInSidebar,
        historyPersistentToggle: !!historyPersistentToggle,
        personasPersistentToggle: !!personasPersistentToggle
    });
    
    // Toggle history sidebar
    function toggleHistorySidebar() {
        if (historySidebar) {
            const wasCollapsed = historySidebar.classList.contains('collapsed');
            historySidebar.classList.toggle('collapsed');
            chatContainer.classList.toggle('history-collapsed');
            
            // Force a reflow to ensure the transition works properly
            void historySidebar.offsetWidth;
            
            console.log('History sidebar toggled:', wasCollapsed ? 'expanded' : 'collapsed');
        } else {
            console.error('History sidebar element not found');
        }
    }
    
    // Toggle personas sidebar
    function togglePersonasSidebar() {
        if (personasSidebar) {
            const wasCollapsed = personasSidebar.classList.contains('collapsed');
            personasSidebar.classList.toggle('collapsed');
            chatContainer.classList.toggle('personas-collapsed');
            
            // Force a reflow to ensure the transition works properly
            void personasSidebar.offsetWidth;
            
            console.log('Personas sidebar toggled:', wasCollapsed ? 'expanded' : 'collapsed');
        } else {
            console.error('Personas sidebar element not found');
        }
    }
    
    // Add event listeners for the toggle buttons in sidebars
    if (historyToggleInSidebar) {
        historyToggleInSidebar.addEventListener('click', function(e) {
            console.log('History sidebar toggle button clicked');
            e.preventDefault();
            toggleHistorySidebar();
        });
    } else {
        console.warn('History sidebar toggle button not found');
        
        // Try to find by alternative selector
        const altHistoryToggle = document.querySelector('.sidebar-toggle');
        if (altHistoryToggle) {
            console.log('Found alternative history toggle button');
            altHistoryToggle.addEventListener('click', function(e) {
                console.log('Alternative history toggle button clicked');
                e.preventDefault();
                toggleHistorySidebar();
            });
        }
    }
    
    if (personasToggleInSidebar) {
        personasToggleInSidebar.addEventListener('click', function(e) {
            console.log('Personas sidebar toggle button clicked');
            e.preventDefault();
            togglePersonasSidebar();
        });
    } else {
        console.warn('Personas sidebar toggle button not found');
        
        // Try to find by alternative selector
        const altPersonasToggle = document.querySelectorAll('.sidebar-toggle')[1];
        if (altPersonasToggle) {
            console.log('Found alternative personas toggle button');
            altPersonasToggle.addEventListener('click', function(e) {
                console.log('Alternative personas toggle button clicked');
                e.preventDefault();
                togglePersonasSidebar();
            });
        }
    }
    
    // Add event listeners for the persistent toggle buttons
    if (historyPersistentToggle) {
        historyPersistentToggle.addEventListener('click', function(e) {
            console.log('History persistent toggle button clicked');
            e.preventDefault();
            toggleHistorySidebar();
        });
    } else {
        console.warn('History persistent toggle button not found');
    }
    
    if (personasPersistentToggle) {
        personasPersistentToggle.addEventListener('click', function(e) {
            console.log('Personas persistent toggle button clicked');
            e.preventDefault();
            togglePersonasSidebar();
        });
    } else {
        console.warn('Personas persistent toggle button not found');
    }
    
    // Set initial scroll position to bottom
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add global toggle functions for debugging
    window.toggleHistorySidebar = toggleHistorySidebar;
    window.togglePersonasSidebar = togglePersonasSidebar;
    
    // Log initialization
    console.log('Sidebar toggle functionality initialized');
}); 