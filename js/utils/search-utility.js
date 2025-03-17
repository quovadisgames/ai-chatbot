/**
 * Search Utility
 * 
 * Provides functions for searching through conversations and messages.
 */

class SearchUtility {
  constructor() {
    // Default search options
    this.defaultOptions = {
      caseSensitive: false,
      wholeWord: false,
      includeSystemMessages: true
    };
  }
  
  /**
   * Search for text in conversations
   * 
   * @param {Array} conversations - Array of conversation metadata objects
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Array of matching conversation metadata objects
   */
  searchConversations(conversations, query, options = {}) {
    if (!query || query.trim() === '' || !Array.isArray(conversations)) {
      return conversations;
    }
    
    // Merge default options with provided options
    const searchOptions = { ...this.defaultOptions, ...options };
    
    // Prepare query
    const searchQuery = searchOptions.caseSensitive ? query.trim() : query.trim().toLowerCase();
    
    // Filter conversations
    return conversations.filter(conversation => {
      // Search in title
      const title = searchOptions.caseSensitive ? conversation.title : conversation.title.toLowerCase();
      if (this.matchesSearch(title, searchQuery, searchOptions)) {
        return true;
      }
      
      // If we have conversation data, search in messages
      if (conversation.messages && Array.isArray(conversation.messages)) {
        return this.searchInMessages(conversation.messages, searchQuery, searchOptions);
      }
      
      return false;
    });
  }
  
  /**
   * Search for text in messages
   * 
   * @param {Array} messages - Array of message objects
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {boolean} - True if any message matches the query
   */
  searchInMessages(messages, query, options = {}) {
    if (!query || query.trim() === '' || !Array.isArray(messages)) {
      return false;
    }
    
    // Merge default options with provided options
    const searchOptions = { ...this.defaultOptions, ...options };
    
    // Prepare query
    const searchQuery = searchOptions.caseSensitive ? query.trim() : query.trim().toLowerCase();
    
    // Check each message
    return messages.some(message => {
      // Skip system messages if option is disabled
      if (message.role === 'system' && !searchOptions.includeSystemMessages) {
        return false;
      }
      
      // Get message content
      const content = searchOptions.caseSensitive ? message.content : message.content.toLowerCase();
      
      // Check if content matches search query
      return this.matchesSearch(content, searchQuery, searchOptions);
    });
  }
  
  /**
   * Find all messages that match a search query
   * 
   * @param {Array} messages - Array of message objects
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Array of indices of matching messages
   */
  findMatchingMessages(messages, query, options = {}) {
    if (!query || query.trim() === '' || !Array.isArray(messages)) {
      return [];
    }
    
    // Merge default options with provided options
    const searchOptions = { ...this.defaultOptions, ...options };
    
    // Prepare query
    const searchQuery = searchOptions.caseSensitive ? query.trim() : query.trim().toLowerCase();
    
    // Find matching messages
    const matchingIndices = [];
    
    messages.forEach((message, index) => {
      // Skip system messages if option is disabled
      if (message.role === 'system' && !searchOptions.includeSystemMessages) {
        return;
      }
      
      // Get message content
      const content = searchOptions.caseSensitive ? message.content : message.content.toLowerCase();
      
      // Check if content matches search query
      if (this.matchesSearch(content, searchQuery, searchOptions)) {
        matchingIndices.push(index);
      }
    });
    
    return matchingIndices;
  }
  
  /**
   * Check if text matches a search query
   * 
   * @param {string} text - Text to search in
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {boolean} - True if text matches query
   */
  matchesSearch(text, query, options = {}) {
    if (!text || !query) return false;
    
    // Merge default options with provided options
    const searchOptions = { ...this.defaultOptions, ...options };
    
    if (searchOptions.wholeWord) {
      // Create regex for whole word search
      const regex = searchOptions.caseSensitive
        ? new RegExp(`\\b${this.escapeRegExp(query)}\\b`, 'g')
        : new RegExp(`\\b${this.escapeRegExp(query)}\\b`, 'gi');
      
      return regex.test(text);
    } else {
      // Simple includes search
      return text.includes(query);
    }
  }
  
  /**
   * Highlight search matches in text
   * 
   * @param {string} text - Text to highlight matches in
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {string} - Text with highlighted matches
   */
  highlightMatches(text, query, options = {}) {
    if (!text || !query || query.trim() === '') {
      return text;
    }
    
    // Merge default options with provided options
    const searchOptions = { ...this.defaultOptions, ...options };
    
    // Prepare query
    const searchQuery = searchOptions.caseSensitive ? query.trim() : query.trim().toLowerCase();
    
    // Create regex for highlighting
    let regex;
    if (searchOptions.wholeWord) {
      regex = searchOptions.caseSensitive
        ? new RegExp(`\\b(${this.escapeRegExp(searchQuery)})\\b`, 'g')
        : new RegExp(`\\b(${this.escapeRegExp(searchQuery)})\\b`, 'gi');
    } else {
      regex = searchOptions.caseSensitive
        ? new RegExp(`(${this.escapeRegExp(searchQuery)})`, 'g')
        : new RegExp(`(${this.escapeRegExp(searchQuery)})`, 'gi');
    }
    
    // Replace matches with highlighted version
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  /**
   * Escape special characters in a string for use in a regular expression
   * 
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Get search options from UI elements
   * 
   * @returns {Object} - Search options object
   */
  getSearchOptionsFromUI() {
    const options = { ...this.defaultOptions };
    
    // Get case sensitive option
    const caseSensitiveCheckbox = document.getElementById('search-case-sensitive');
    if (caseSensitiveCheckbox) {
      options.caseSensitive = caseSensitiveCheckbox.checked;
    }
    
    // Get whole word option
    const wholeWordCheckbox = document.getElementById('search-whole-word');
    if (wholeWordCheckbox) {
      options.wholeWord = wholeWordCheckbox.checked;
    }
    
    // Get include system messages option
    const includeSystemCheckbox = document.getElementById('search-include-system');
    if (includeSystemCheckbox) {
      options.includeSystemMessages = includeSystemCheckbox.checked;
    }
    
    return options;
  }
}

// Create and export a singleton instance
const searchUtility = new SearchUtility();
export default searchUtility; 