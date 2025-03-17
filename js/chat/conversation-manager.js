/**
 * Conversation Manager
 * 
 * Manages chat conversations, including creating, loading, and switching between conversations.
 */

import chatService from '../api/chat-service.js';
import messageHandler from './message-handler.js';
import tokenCounter from '../utils/token-counter.js';
import personaManager from './persona-manager.js';
import searchUtility from '../utils/search-utility.js';

class ConversationManager {
  constructor() {
    // Active conversation ID
    this.activeConversationId = null;
    
    // Flag to track initialization
    this.initialized = false;
    
    // Current search query
    this.currentSearchQuery = '';
    
    // All conversations (for search filtering)
    this.allConversations = [];
    
    // DOM elements
    this.conversationList = document.getElementById('conversation-list');
    this.conversationTitle = document.getElementById('conversation-title');
    this.newConversationButton = document.getElementById('new-conversation-btn');
    this.clearConversationButton = document.getElementById('clear-conversation-btn');
    this.exportButton = document.getElementById('export-conversations-btn');
    this.importButton = document.getElementById('import-conversations-btn');
    this.searchInput = document.getElementById('conversation-search');
    this.searchToggle = document.getElementById('search-toggle');
    this.searchOptions = document.getElementById('search-options');
    
    // Bind event handlers
    this.bindEventHandlers();
  }
  
  /**
   * Initialize the conversation manager
   */
  initialize() {
    if (this.initialized) return;
    
    // Load conversation list
    this.loadConversationList();
    
    // Create a new conversation if none exists
    if (!this.activeConversationId) {
      this.createNewConversation();
    }
    
    // Initialize search functionality
    this.initializeSearch();
    
    this.initialized = true;
  }
  
  /**
   * Bind event handlers for UI elements
   */
  bindEventHandlers() {
    // New conversation button
    if (this.newConversationButton) {
      this.newConversationButton.addEventListener('click', () => {
        this.createNewConversation();
      });
    }
    
    // Clear conversation button
    if (this.clearConversationButton) {
      this.clearConversationButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
          this.clearConversation(this.activeConversationId);
        }
      });
    }
    
    // Export button
    if (this.exportButton) {
      this.exportButton.addEventListener('click', () => {
        chatService.exportAllConversations();
      });
    }
    
    // Import button
    if (this.importButton) {
      this.importButton.addEventListener('click', () => {
        this.showImportDialog();
      });
    }
    
    // Listen for token usage updates
    document.addEventListener('tokenUsageUpdated', (event) => {
      if (event.detail && event.detail.conversationId === this.activeConversationId) {
        this.updateTokenUsageDisplay();
      }
    });
  }
  
  /**
   * Initialize search functionality
   */
  initializeSearch() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.currentSearchQuery = this.searchInput.value.trim();
        this.filterConversationList();
      });
    }
    
    // Search toggle
    if (this.searchToggle && this.searchOptions) {
      this.searchToggle.addEventListener('click', () => {
        // Toggle search options visibility
        const isVisible = this.searchOptions.style.display !== 'none';
        this.searchOptions.style.display = isVisible ? 'none' : 'block';
      });
    }
    
    // Search option checkboxes
    const optionCheckboxes = document.querySelectorAll('#search-options input[type="checkbox"]');
    optionCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // Re-filter when options change
        this.filterConversationList();
      });
    });
  }
  
  /**
   * Filter conversation list based on search query
   */
  filterConversationList() {
    if (!this.allConversations || this.allConversations.length === 0) return;
    
    if (!this.currentSearchQuery) {
      // If no search query, show all conversations
      this.updateConversationListUI(this.allConversations);
      return;
    }
    
    // Get search options from UI
    const searchOptions = searchUtility.getSearchOptionsFromUI();
    
    // Search conversations
    const filteredConversations = searchUtility.searchConversations(
      this.allConversations,
      this.currentSearchQuery,
      searchOptions
    );
    
    // Update UI with filtered conversations
    this.updateConversationListUI(filteredConversations);
  }
  
  /**
   * Load the conversation list
   */
  loadConversationList() {
    // Get all conversation metadata
    const conversations = chatService.getAllConversationMetadata();
    
    // Store all conversations for search filtering
    this.allConversations = conversations;
    
    // Sort by updated date (newest first)
    conversations.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    // Update UI with all conversations
    this.updateConversationListUI(conversations);
    
    // Load the most recent conversation if none is active
    if (conversations.length > 0 && !this.activeConversationId) {
      this.loadConversation(conversations[0].id);
    }
  }
  
  /**
   * Update the conversation list UI
   * 
   * @param {Array} conversations - Array of conversation metadata objects
   */
  updateConversationListUI(conversations) {
    // Clear conversation list
    if (this.conversationList) {
      this.conversationList.innerHTML = '';
    }
    
    // Check if we're searching and have no results
    if (this.currentSearchQuery && conversations.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = `
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No conversations found for "${this.currentSearchQuery}"</div>
      `;
      this.conversationList.appendChild(noResults);
      return;
    }
    
    // Add conversations to list
    conversations.forEach(conversation => {
      this.addConversationToList(conversation);
    });
  }
  
  /**
   * Add a conversation to the list
   * 
   * @param {Object} conversation - Conversation metadata
   */
  addConversationToList(conversation) {
    if (!this.conversationList) return;
    
    // Create list item
    const listItem = document.createElement('li');
    listItem.className = 'conversation-item';
    listItem.dataset.id = conversation.id;
    
    // Add active class if this is the active conversation
    if (conversation.id === this.activeConversationId) {
      listItem.classList.add('active');
    }
    
    // Format date
    const date = new Date(conversation.updatedAt);
    const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    // Highlight title if searching
    let title = conversation.title;
    if (this.currentSearchQuery) {
      title = searchUtility.highlightMatches(
        title,
        this.currentSearchQuery,
        searchUtility.getSearchOptionsFromUI()
      );
    }
    
    // Create HTML content
    listItem.innerHTML = `
      <div class="conversation-info">
        <span class="conversation-title">${title}</span>
        <span class="conversation-date">${formattedDate}</span>
      </div>
      <div class="conversation-actions">
        <button class="rename-btn" title="Rename conversation">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-btn" title="Delete conversation">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    // Add click event to load conversation
    listItem.addEventListener('click', (event) => {
      // Ignore clicks on buttons
      if (event.target.closest('.conversation-actions')) {
        return;
      }
      
      this.loadConversation(conversation.id);
    });
    
    // Add rename button event
    const renameButton = listItem.querySelector('.rename-btn');
    if (renameButton) {
      renameButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.renameConversation(conversation.id);
      });
    }
    
    // Add delete button event
    const deleteButton = listItem.querySelector('.delete-btn');
    if (deleteButton) {
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
          this.deleteConversation(conversation.id);
        }
      });
    }
    
    // Add to list
    this.conversationList.appendChild(listItem);
  }
  
  /**
   * Create a new conversation
   */
  createNewConversation() {
    // Create new conversation
    const conversationId = chatService.createNewConversation();
    
    // Load the new conversation
    this.loadConversation(conversationId);
    
    // Update conversation list
    this.loadConversationList();
    
    return conversationId;
  }
  
  /**
   * Load a conversation
   * 
   * @param {string} conversationId - ID of the conversation to load
   */
  loadConversation(conversationId) {
    if (!conversationId) return;
    
    // Set active conversation
    this.activeConversationId = conversationId;
    
    // Get conversation metadata
    const metadata = chatService.getAllConversationMetadata()
      .find(meta => meta.id === conversationId);
    
    // Update conversation title
    if (this.conversationTitle && metadata) {
      this.conversationTitle.textContent = metadata.title;
      this.conversationTitle.dataset.id = conversationId;
    }
    
    // Update active conversation in list
    this.updateActiveConversationUI();
    
    // Initialize message handler with conversation
    messageHandler.initialize(conversationId);
    
    // Update token usage display
    this.updateTokenUsageDisplay();
  }
  
  /**
   * Delete a conversation
   * 
   * @param {string} conversationId - ID of the conversation to delete
   */
  deleteConversation(conversationId) {
    if (!conversationId) return;
    
    // Delete conversation
    chatService.deleteConversation(conversationId);
    
    // If this was the active conversation, create a new one
    if (conversationId === this.activeConversationId) {
      // Get remaining conversations
      const conversations = chatService.getAllConversationMetadata();
      
      if (conversations.length > 0) {
        // Load the most recent conversation
        this.loadConversation(conversations[0].id);
      } else {
        // Create a new conversation if none left
        this.createNewConversation();
      }
    }
    
    // Update conversation list
    this.loadConversationList();
  }
  
  /**
   * Rename a conversation
   * 
   * @param {string} conversationId - ID of the conversation to rename
   */
  renameConversation(conversationId) {
    if (!conversationId) return;
    
    // Get conversation metadata
    const metadata = chatService.getAllConversationMetadata()
      .find(meta => meta.id === conversationId);
    
    if (!metadata) return;
    
    // Prompt for new title
    const newTitle = prompt('Enter a new title for this conversation:', metadata.title);
    
    if (newTitle && newTitle.trim() !== '') {
      // Update conversation metadata
      chatService.updateConversationMetadata(conversationId, {
        title: newTitle.trim()
      });
      
      // Update UI if this is the active conversation
      if (conversationId === this.activeConversationId && this.conversationTitle) {
        this.conversationTitle.textContent = newTitle.trim();
      }
      
      // Update conversation list
      this.loadConversationList();
    }
  }
  
  /**
   * Clear a conversation
   * 
   * @param {string} conversationId - ID of the conversation to clear
   */
  clearConversation(conversationId) {
    if (!conversationId) return;
    
    // Save empty conversation
    chatService.saveConversation(conversationId, []);
    
    // Reload conversation
    this.loadConversation(conversationId);
  }
  
  /**
   * Update the active conversation in the UI
   */
  updateActiveConversationUI() {
    if (!this.conversationList) return;
    
    // Remove active class from all conversations
    const items = this.conversationList.querySelectorAll('.conversation-item');
    items.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to current conversation
    const activeItem = this.conversationList.querySelector(`.conversation-item[data-id="${this.activeConversationId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
  
  /**
   * Update token usage display
   */
  updateTokenUsageDisplay() {
    // Get token usage for active conversation
    const usage = tokenCounter.getConversationTokenUsage(this.activeConversationId);
    
    // Update token display
    this.updateTokenDisplay(usage);
    
    // Update cost display
    this.updateCostDisplay(usage);
  }
  
  /**
   * Update token display
   * 
   * @param {Object} usage - Token usage object
   */
  updateTokenDisplay(usage) {
    if (!usage) return;
    
    // Get token display elements
    const promptTokensElement = document.getElementById('prompt-tokens');
    const completionTokensElement = document.getElementById('completion-tokens');
    const totalTokensElement = document.getElementById('total-tokens');
    
    // Update display if elements exist
    if (promptTokensElement) {
      promptTokensElement.textContent = usage.promptTokens || 0;
    }
    
    if (completionTokensElement) {
      completionTokensElement.textContent = usage.completionTokens || 0;
    }
    
    if (totalTokensElement) {
      totalTokensElement.textContent = usage.totalTokens || 0;
    }
  }
  
  /**
   * Update cost display
   * 
   * @param {Object} usage - Token usage object
   */
  updateCostDisplay(usage) {
    if (!usage) return;
    
    // Calculate cost
    const cost = tokenCounter.calculateCost(usage, usage.model);
    
    // Get cost display element
    const costElement = document.getElementById('total-cost');
    if (costElement) {
      costElement.textContent = `$${cost.totalCost.toFixed(6)}`;
    }
  }
  
  /**
   * Show import dialog
   */
  showImportDialog() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // Add change event
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.importConversations(file);
      }
    });
    
    // Trigger file selection
    fileInput.click();
  }
  
  /**
   * Import conversations from a file
   * 
   * @param {File} file - JSON file to import
   */
  async importConversations(file) {
    try {
      // Import conversations
      const result = await chatService.importConversations(file);
      
      // Show success message
      alert(`Successfully imported ${result.count} conversations.`);
      
      // Update conversation list
      this.loadConversationList();
    } catch (error) {
      console.error('Error importing conversations:', error);
      alert(`Error importing conversations: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
const conversationManager = new ConversationManager();
export default conversationManager; 