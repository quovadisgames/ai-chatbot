/**
 * Message Handler
 * 
 * Handles sending, receiving, and displaying messages in the chat interface.
 */

import chatService from '../api/chat-service.js';
import tokenCounter from '../utils/token-counter.js';
import searchUtility from '../utils/search-utility.js';
import tokenOptimizer from '../utils/token-optimizer.js';
import personaManager from './persona-manager.js';

class MessageHandler {
  constructor() {
    // DOM elements
    this.chatContainer = document.getElementById('chat-messages');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
    this.searchButton = document.getElementById('message-search-button');
    this.searchContainer = document.getElementById('message-search-container');
    this.searchInput = document.getElementById('message-search-input');
    this.searchPrev = document.getElementById('message-search-prev');
    this.searchNext = document.getElementById('message-search-next');
    this.searchClose = document.getElementById('message-search-close');
    this.searchResults = document.getElementById('message-search-results');
    this.optimizationContainer = document.getElementById('optimization-container');
    
    // Current conversation ID
    this.activeConversationId = null;
    
    // Message processing state
    this.isProcessing = false;
    
    // Search state
    this.currentMatches = [];
    this.currentMatchIndex = -1;
    
    // Initialize search functionality
    this.initializeSearch();
    
    // Initialize token optimization dashboard
    this.initializeOptimizationDashboard();
    
    // Listen for persona changes
    document.addEventListener('personaChanged', (event) => {
      if (event.detail && event.detail.personaId) {
        this.updateOptimizationDashboard(event.detail.personaId);
      }
    });
  }
  
  /**
   * Initialize the message handler
   * 
   * @param {string} conversationId - ID of the conversation to load
   */
  initialize(conversationId) {
    this.activeConversationId = conversationId;
    
    // Clear the chat container
    this.clearChatDisplay();
    
    // Clear search state
    this.clearSearch();
    
    // Load conversation messages if available
    if (conversationId) {
      this.loadConversationMessages(conversationId);
    }
    
    // Update optimization dashboard
    const activePersona = personaManager.getActivePersona();
    if (activePersona) {
      this.updateOptimizationDashboard(activePersona.id);
    }
  }
  
  /**
   * Initialize token optimization dashboard
   */
  initializeOptimizationDashboard() {
    if (!this.optimizationContainer) return;
    
    // Create toggle button for optimization panel
    const toggleButton = document.createElement('button');
    toggleButton.className = 'optimization-toggle';
    toggleButton.innerHTML = '<i class="fas fa-chart-line"></i> Token Optimization';
    toggleButton.addEventListener('click', () => {
      this.toggleOptimizationPanel();
    });
    
    // Add toggle button to UI
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
      chatHeader.appendChild(toggleButton);
    }
    
    // Create optimization panel
    const optimizationPanel = document.createElement('div');
    optimizationPanel.className = 'optimization-panel';
    optimizationPanel.style.display = 'none';
    
    // Add panel to container
    this.optimizationContainer.appendChild(optimizationPanel);
    
    // Update dashboard with active persona
    const activePersona = personaManager.getActivePersona();
    if (activePersona) {
      this.updateOptimizationDashboard(activePersona.id);
    }
  }
  
  /**
   * Toggle optimization panel visibility
   */
  toggleOptimizationPanel() {
    const panel = document.querySelector('.optimization-panel');
    if (panel) {
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      
      // Update dashboard when showing panel
      if (!isVisible) {
        const activePersona = personaManager.getActivePersona();
        if (activePersona) {
          this.updateOptimizationDashboard(activePersona.id);
        }
      }
    }
  }
  
  /**
   * Update optimization dashboard with persona data
   * 
   * @param {string} personaId - ID of the persona to display
   */
  updateOptimizationDashboard(personaId) {
    const panel = document.querySelector('.optimization-panel');
    if (!panel || !personaId) return;
    
    // Create dashboard in panel
    tokenOptimizer.createTokenSavingsDashboard('optimization-container', personaId);
  }
  
  /**
   * Initialize search functionality
   */
  initializeSearch() {
    // Search button
    if (this.searchButton && this.searchContainer) {
      this.searchButton.addEventListener('click', () => {
        // Toggle search container visibility
        const isVisible = this.searchContainer.style.display !== 'none' && 
                         this.searchContainer.style.display !== '';
        
        if (isVisible) {
          this.searchContainer.style.display = 'none';
          this.clearSearch();
        } else {
          this.searchContainer.style.display = 'flex';
          this.searchInput.focus();
        }
      });
    }
    
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.searchMessages();
      });
      
      // Handle keyboard shortcuts
      this.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Enter: previous match
            this.navigateToPreviousMatch();
          } else {
            // Enter: next match
            this.navigateToNextMatch();
          }
        } else if (event.key === 'Escape') {
          // Escape: close search
          this.searchContainer.style.display = 'none';
          this.clearSearch();
        }
      });
    }
    
    // Previous match button
    if (this.searchPrev) {
      this.searchPrev.addEventListener('click', () => {
        this.navigateToPreviousMatch();
      });
    }
    
    // Next match button
    if (this.searchNext) {
      this.searchNext.addEventListener('click', () => {
        this.navigateToNextMatch();
      });
    }
    
    // Close button
    if (this.searchClose) {
      this.searchClose.addEventListener('click', () => {
        this.searchContainer.style.display = 'none';
        this.clearSearch();
      });
    }
  }
  
  /**
   * Search messages in the current conversation
   */
  searchMessages() {
    if (!this.searchInput || !this.chatContainer) return;
    
    const query = this.searchInput.value.trim();
    
    // Clear existing highlights
    this.clearSearchHighlights();
    
    if (query === '') {
      // Reset search state
      this.currentMatches = [];
      this.currentMatchIndex = -1;
      this.updateSearchResults(0);
      return;
    }
    
    // Get search options
    const options = searchUtility.getSearchOptionsFromUI();
    
    // Find all message elements
    const messageElements = this.chatContainer.querySelectorAll('.message');
    
    // Find matches
    const matches = [];
    
    messageElements.forEach((messageElement, index) => {
      // Skip system messages if option is disabled
      if (messageElement.classList.contains('system') && !options.includeSystemMessages) {
        return;
      }
      
      // Get message content
      const contentElement = messageElement.querySelector('.content');
      if (!contentElement) return;
      
      const content = contentElement.textContent;
      
      // Check if content matches search query
      if (searchUtility.matchesSearch(content, query, options)) {
        matches.push(messageElement);
        
        // Add search-match class
        messageElement.classList.add('search-match');
        
        // Highlight matches in content
        const originalHTML = contentElement.innerHTML;
        const highlightedHTML = searchUtility.highlightMatches(originalHTML, query, options);
        contentElement.innerHTML = highlightedHTML;
      }
    });
    
    // Update search state
    this.currentMatches = matches;
    this.currentMatchIndex = matches.length > 0 ? 0 : -1;
    
    // Update search results count
    this.updateSearchResults(matches.length);
    
    // Highlight current match
    this.highlightCurrentMatch();
  }
  
  /**
   * Navigate to the previous match
   */
  navigateToPreviousMatch() {
    if (this.currentMatches.length === 0 || this.currentMatchIndex <= 0) return;
    
    this.currentMatchIndex--;
    this.highlightCurrentMatch();
    
    // Update button states
    if (this.searchNext) this.searchNext.disabled = false;
    if (this.searchPrev) this.searchPrev.disabled = this.currentMatchIndex === 0;
  }
  
  /**
   * Navigate to the next match
   */
  navigateToNextMatch() {
    if (this.currentMatches.length === 0 || this.currentMatchIndex >= this.currentMatches.length - 1) return;
    
    this.currentMatchIndex++;
    this.highlightCurrentMatch();
    
    // Update button states
    if (this.searchPrev) this.searchPrev.disabled = false;
    if (this.searchNext) this.searchNext.disabled = this.currentMatchIndex === this.currentMatches.length - 1;
  }
  
  /**
   * Highlight the current match
   */
  highlightCurrentMatch() {
    if (this.currentMatches.length === 0 || this.currentMatchIndex < 0) return;
    
    // Remove current-match class from all matches
    this.currentMatches.forEach(match => {
      match.classList.remove('current-match');
    });
    
    // Add current-match class to current match
    const currentMatch = this.currentMatches[this.currentMatchIndex];
    currentMatch.classList.add('current-match');
    
    // Scroll to current match
    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  /**
   * Update search results count
   * 
   * @param {number} count - Number of matches
   */
  updateSearchResults(count) {
    if (!this.searchResults) return;
    
    if (count === 0) {
      this.searchResults.textContent = 'No matches';
      if (this.searchPrev) this.searchPrev.disabled = true;
      if (this.searchNext) this.searchNext.disabled = true;
    } else {
      this.searchResults.textContent = `${this.currentMatchIndex + 1} of ${count}`;
      if (this.searchPrev) this.searchPrev.disabled = this.currentMatchIndex === 0;
      if (this.searchNext) this.searchNext.disabled = this.currentMatchIndex === count - 1;
    }
  }
  
  /**
   * Clear search highlights
   */
  clearSearchHighlights() {
    if (!this.chatContainer) return;
    
    // Remove search-match class from all messages
    const matchedMessages = this.chatContainer.querySelectorAll('.message.search-match');
    matchedMessages.forEach(message => {
      message.classList.remove('search-match');
      message.classList.remove('current-match');
    });
    
    // Remove highlight marks
    const highlightMarks = this.chatContainer.querySelectorAll('.search-highlight');
    highlightMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        // Replace the mark with its text content
        const text = document.createTextNode(mark.textContent);
        parent.replaceChild(text, mark);
      }
    });
  }
  
  /**
   * Clear search state
   */
  clearSearch() {
    // Clear search input
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    // Clear search highlights
    this.clearSearchHighlights();
    
    // Reset search state
    this.currentMatches = [];
    this.currentMatchIndex = -1;
    
    // Update search results
    this.updateSearchResults(0);
  }
  
  /**
   * Load and display messages from a conversation
   * 
   * @param {string} conversationId - ID of the conversation to load
   */
  loadConversationMessages(conversationId) {
    // Get conversation messages
    const messages = chatService.getConversation(conversationId);
    
    if (!messages || messages.length === 0) {
      // Display welcome message if no messages
      this.displaySystemMessage('How can I help you today?');
      return;
    }
    
    // Display each message
    messages.forEach(message => {
      this.displayMessage(message);
    });
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Send a message to the AI
   * 
   * @param {string} messageText - Message text to send
   * @param {string} personaId - ID of the persona to use
   */
  async sendMessage(messageText, personaId = null) {
    if (!messageText || this.isProcessing) return;
    
    // Set processing state
    this.isProcessing = true;
    this.setInputState(true);
    
    try {
      // Create conversation if none exists
      if (!this.activeConversationId) {
        this.activeConversationId = chatService.createNewConversation();
      }
      
      // Get active persona if not provided
      if (!personaId) {
        const activePersona = personaManager.getActivePersona();
        personaId = activePersona ? activePersona.id : 'default';
      }
      
      // Apply chat rules to message if enabled
      const modifiedMessage = tokenOptimizer.applyRulesToMessage(messageText);
      
      // Create user message object
      const userMessage = {
        role: 'user',
        content: modifiedMessage
      };
      
      // Display user message (show original message to user, not the modified one)
      const displayMessage = {
        role: 'user',
        content: messageText
      };
      this.displayMessage(displayMessage);
      
      // Add to conversation
      chatService.addMessageToConversation(this.activeConversationId, userMessage);
      
      // Show typing indicator
      this.displayTypingIndicator();
      
      // Get conversation history
      const conversationHistory = chatService.getConversation(this.activeConversationId);
      
      // Prepare options
      const options = {};
      if (personaId) {
        options.persona = personaId;
      }
      
      // Send to API
      const response = await chatService.sendMessage(conversationHistory, options);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Extract AI message from response
      const aiMessage = {
        role: 'assistant',
        content: response.choices[0].message.content
      };
      
      // Display AI message
      this.displayMessage(aiMessage);
      
      // Add to conversation
      chatService.addMessageToConversation(this.activeConversationId, aiMessage);
      
      // Record token usage
      if (response.usage) {
        // Record in token counter
        tokenCounter.recordTokenUsage(
          this.activeConversationId,
          response.usage,
          response.model
        );
        
        // Record in token optimizer with persona info
        tokenOptimizer.recordPersonaTokenUsage(
          personaId,
          {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          },
          response.model
        );
        
        // Update conversation metadata with token usage
        chatService.updateConversationMetadata(this.activeConversationId, {
          tokenUsage: response.usage.total_tokens,
          lastModel: response.model,
          personaId: personaId
        });
        
        // Trigger token usage update event
        this.triggerEvent('tokenUsageUpdated', {
          conversationId: this.activeConversationId,
          usage: response.usage,
          personaId: personaId
        });
        
        // Update optimization dashboard
        this.updateOptimizationDashboard(personaId);
      }
      
      // Trigger message received event
      this.triggerEvent('messageReceived', {
        conversationId: this.activeConversationId,
        message: aiMessage,
        personaId: personaId
      });
    } catch (error) {
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Display error message
      this.displayErrorMessage(error.message);
      
      console.error('Error sending message:', error);
    } finally {
      // Reset processing state
      this.isProcessing = false;
      this.setInputState(false);
      
      // Scroll to bottom
      this.scrollToBottom();
    }
  }
  
  /**
   * Display a message in the chat container
   * 
   * @param {Object} message - Message object with role and content
   */
  displayMessage(message) {
    if (!message || !message.content) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    
    // Create avatar
    const avatarElement = document.createElement('div');
    avatarElement.className = 'avatar';
    
    // Set avatar based on role
    if (message.role === 'user') {
      avatarElement.innerHTML = '<i class="fas fa-user"></i>';
    } else if (message.role === 'assistant') {
      avatarElement.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
      avatarElement.innerHTML = '<i class="fas fa-info-circle"></i>';
    }
    
    // Create content container
    const contentElement = document.createElement('div');
    contentElement.className = 'content';
    
    // Process and set content
    const formattedContent = this.formatMessageContent(message.content);
    contentElement.innerHTML = formattedContent;
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = this.formatTimestamp(message.timestamp || new Date());
    
    // Assemble message
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    // Add to chat container
    this.chatContainer.appendChild(messageElement);
    
    // Apply syntax highlighting to code blocks
    this.applyCodeHighlighting(messageElement);
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Display a system message
   * 
   * @param {string} content - Message content
   */
  displaySystemMessage(content) {
    this.displayMessage({
      role: 'system',
      content: content,
      timestamp: new Date()
    });
  }
  
  /**
   * Display an error message
   * 
   * @param {string} errorMessage - Error message to display
   */
  displayErrorMessage(errorMessage) {
    const message = {
      role: 'system',
      content: `<div class="error-message">Error: ${errorMessage}</div>`,
      timestamp: new Date()
    };
    
    this.displayMessage(message);
  }
  
  /**
   * Display typing indicator
   */
  displayTypingIndicator() {
    // Remove existing indicator if any
    this.removeTypingIndicator();
    
    // Create typing indicator
    const indicatorElement = document.createElement('div');
    indicatorElement.className = 'message assistant typing-indicator';
    indicatorElement.innerHTML = `
      <div class="avatar"><i class="fas fa-robot"></i></div>
      <div class="content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    // Add to chat container
    this.chatContainer.appendChild(indicatorElement);
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = this.chatContainer.querySelector('.typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  /**
   * Format message content with markdown and code highlighting
   * 
   * @param {string} content - Message content
   * @returns {string} - Formatted HTML content
   */
  formatMessageContent(content) {
    if (!content) return '';
    
    // Replace newlines with <br>
    let formatted = content.replace(/\n/g, '<br>');
    
    // Format code blocks
    formatted = this.formatCodeBlocks(formatted);
    
    // Format inline code
    formatted = this.formatInlineCode(formatted);
    
    // Format bold text
    formatted = this.formatBoldText(formatted);
    
    // Format italic text
    formatted = this.formatItalicText(formatted);
    
    // Format links
    formatted = this.formatLinks(formatted);
    
    return formatted;
  }
  
  /**
   * Format code blocks in message content
   * 
   * @param {string} content - Message content
   * @returns {string} - Content with formatted code blocks
   */
  formatCodeBlocks(content) {
    // Replace ```language\ncode\n``` with <pre><code class="language-{language}">code</code></pre>
    return content.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, (match, language, code) => {
      // Escape HTML in code
      const escapedCode = this.escapeHtml(code);
      
      return `<pre><code class="language-${language || 'plaintext'}">${escapedCode}</code></pre>`;
    });
  }
  
  /**
   * Format inline code in message content
   * 
   * @param {string} content - Message content
   * @returns {string} - Content with formatted inline code
   */
  formatInlineCode(content) {
    // Replace `code` with <code>code</code>
    return content.replace(/`([^`]+)`/g, (match, code) => {
      // Escape HTML in code
      const escapedCode = this.escapeHtml(code);
      
      return `<code>${escapedCode}</code>`;
    });
  }
  
  /**
   * Format bold text in message content
   * 
   * @param {string} content - Message content
   * @returns {string} - Content with formatted bold text
   */
  formatBoldText(content) {
    // Replace **text** with <strong>text</strong>
    return content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  
  /**
   * Format italic text in message content
   * 
   * @param {string} content - Message content
   * @returns {string} - Content with formatted italic text
   */
  formatItalicText(content) {
    // Replace *text* with <em>text</em>
    return content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
  
  /**
   * Format links in message content
   * 
   * @param {string} content - Message content
   * @returns {string} - Content with formatted links
   */
  formatLinks(content) {
    // Replace [text](url) with <a href="url">text</a>
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  }
  
  /**
   * Escape HTML special characters
   * 
   * @param {string} html - HTML string to escape
   * @returns {string} - Escaped HTML string
   */
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Apply syntax highlighting to code blocks
   * 
   * @param {HTMLElement} container - Container element with code blocks
   */
  applyCodeHighlighting(container) {
    // Check if Prism is available
    if (window.Prism) {
      // Find all code elements
      const codeElements = container.querySelectorAll('pre code');
      
      // Apply highlighting
      codeElements.forEach(code => {
        Prism.highlightElement(code);
      });
    }
  }
  
  /**
   * Format timestamp
   * 
   * @param {Date} date - Date object
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * Set input state (enabled/disabled)
   * 
   * @param {boolean} disabled - Whether input should be disabled
   */
  setInputState(disabled) {
    if (this.messageInput) {
      this.messageInput.disabled = disabled;
    }
    
    if (this.sendButton) {
      this.sendButton.disabled = disabled;
    }
  }
  
  /**
   * Clear the chat display
   */
  clearChatDisplay() {
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
    }
  }
  
  /**
   * Scroll chat container to bottom
   */
  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }
  
  /**
   * Trigger a custom event
   * 
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  triggerEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }
}

// Create and export a singleton instance
const messageHandler = new MessageHandler();
export default messageHandler; 