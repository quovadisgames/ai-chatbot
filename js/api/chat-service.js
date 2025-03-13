/**
 * Chat Service
 * 
 * Handles API communication with OpenAI and manages conversation data.
 */

class ChatService {
  constructor() {
    // API configuration
    this.apiConfig = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: null,
      defaultModel: 'gpt-3.5-turbo'
    };
    
    // Local storage keys
    this.storageKeys = {
      conversations: 'pdt_ai_conversations',
      conversationMetadata: 'pdt_ai_conversation_metadata',
      apiKey: 'pdt_ai_api_key'
    };
    
    // Initialize API key from storage
    this.loadApiKey();
  }
  
  /**
   * Load API key from local storage
   */
  loadApiKey() {
    try {
      this.apiConfig.apiKey = localStorage.getItem(this.storageKeys.apiKey) || null;
    } catch (error) {
      console.error('Error loading API key:', error);
      this.apiConfig.apiKey = null;
    }
  }
  
  /**
   * Save API key to local storage
   * 
   * @param {string} apiKey - OpenAI API key
   */
  saveApiKey(apiKey) {
    try {
      if (apiKey) {
        localStorage.setItem(this.storageKeys.apiKey, apiKey);
      } else {
        localStorage.removeItem(this.storageKeys.apiKey);
      }
      
      this.apiConfig.apiKey = apiKey;
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }
  
  /**
   * Check if API key is set
   * 
   * @returns {boolean} - True if API key is set
   */
  hasApiKey() {
    return !!this.apiConfig.apiKey;
  }
  
  /**
   * Send a message to the OpenAI API
   * 
   * @param {Array} messages - Array of message objects
   * @param {Object} options - API request options
   * @returns {Promise} - Promise resolving to API response
   */
  async sendMessage(messages, options = {}) {
    if (!this.hasApiKey()) {
      throw new Error('API key not set. Please set your OpenAI API key in the settings.');
    }
    
    // Merge default options with provided options
    const requestOptions = {
      model: this.apiConfig.defaultModel,
      temperature: 0.7,
      max_tokens: 1000,
      ...options
    };
    
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: requestOptions.model,
          messages: messages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw error;
    }
  }
  
  /**
   * Create a new conversation
   * 
   * @param {string} title - Title for the new conversation
   * @returns {string} - ID of the new conversation
   */
  createNewConversation(title = 'New Conversation') {
    // Generate a unique ID for the conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create conversation metadata
    const metadata = {
      id: conversationId,
      title: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save empty conversation
    this.saveConversation(conversationId, []);
    
    // Save metadata
    this.saveConversationMetadata(metadata);
    
    return conversationId;
  }
  
  /**
   * Get a conversation by ID
   * 
   * @param {string} conversationId - ID of the conversation to get
   * @returns {Array} - Array of message objects
   */
  getConversation(conversationId) {
    if (!conversationId) return null;
    
    try {
      const conversationKey = `${this.storageKeys.conversations}_${conversationId}`;
      const conversationData = localStorage.getItem(conversationKey);
      
      if (!conversationData) return null;
      
      return JSON.parse(conversationData);
    } catch (error) {
      console.error(`Error getting conversation ${conversationId}:`, error);
      return null;
    }
  }
  
  /**
   * Save a conversation
   * 
   * @param {string} conversationId - ID of the conversation to save
   * @param {Array} messages - Array of message objects
   * @returns {boolean} - True if successful
   */
  saveConversation(conversationId, messages) {
    if (!conversationId) return false;
    
    try {
      const conversationKey = `${this.storageKeys.conversations}_${conversationId}`;
      localStorage.setItem(conversationKey, JSON.stringify(messages));
      
      // Update conversation metadata
      this.updateConversationMetadata(conversationId, {
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Error saving conversation ${conversationId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a conversation
   * 
   * @param {string} conversationId - ID of the conversation to delete
   * @returns {boolean} - True if successful
   */
  deleteConversation(conversationId) {
    if (!conversationId) return false;
    
    try {
      // Remove conversation data
      const conversationKey = `${this.storageKeys.conversations}_${conversationId}`;
      localStorage.removeItem(conversationKey);
      
      // Remove from metadata
      const allMetadata = this.getAllConversationMetadata();
      const updatedMetadata = allMetadata.filter(meta => meta.id !== conversationId);
      
      localStorage.setItem(this.storageKeys.conversationMetadata, JSON.stringify(updatedMetadata));
      
      return true;
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      return false;
    }
  }
  
  /**
   * Add a message to a conversation
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {Object} message - Message object to add
   * @returns {boolean} - True if successful
   */
  addMessageToConversation(conversationId, message) {
    if (!conversationId || !message) return false;
    
    try {
      // Get existing conversation
      const conversation = this.getConversation(conversationId) || [];
      
      // Add message
      conversation.push(message);
      
      // Save updated conversation
      return this.saveConversation(conversationId, conversation);
    } catch (error) {
      console.error(`Error adding message to conversation ${conversationId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all conversation metadata
   * 
   * @returns {Array} - Array of conversation metadata objects
   */
  getAllConversationMetadata() {
    try {
      const metadataJson = localStorage.getItem(this.storageKeys.conversationMetadata);
      
      if (!metadataJson) return [];
      
      return JSON.parse(metadataJson);
    } catch (error) {
      console.error('Error getting conversation metadata:', error);
      return [];
    }
  }
  
  /**
   * Save conversation metadata
   * 
   * @param {Object} metadata - Conversation metadata object
   * @returns {boolean} - True if successful
   */
  saveConversationMetadata(metadata) {
    if (!metadata || !metadata.id) return false;
    
    try {
      // Get existing metadata
      const allMetadata = this.getAllConversationMetadata();
      
      // Check if metadata already exists
      const existingIndex = allMetadata.findIndex(meta => meta.id === metadata.id);
      
      if (existingIndex >= 0) {
        // Update existing metadata
        allMetadata[existingIndex] = { ...allMetadata[existingIndex], ...metadata };
      } else {
        // Add new metadata
        allMetadata.push(metadata);
      }
      
      // Save updated metadata
      localStorage.setItem(this.storageKeys.conversationMetadata, JSON.stringify(allMetadata));
      
      return true;
    } catch (error) {
      console.error('Error saving conversation metadata:', error);
      return false;
    }
  }
  
  /**
   * Update conversation metadata
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {Object} updates - Object with metadata fields to update
   * @returns {boolean} - True if successful
   */
  updateConversationMetadata(conversationId, updates) {
    if (!conversationId || !updates) return false;
    
    try {
      // Get existing metadata
      const allMetadata = this.getAllConversationMetadata();
      
      // Find metadata for the conversation
      const existingIndex = allMetadata.findIndex(meta => meta.id === conversationId);
      
      if (existingIndex >= 0) {
        // Update metadata
        allMetadata[existingIndex] = { ...allMetadata[existingIndex], ...updates };
        
        // Save updated metadata
        localStorage.setItem(this.storageKeys.conversationMetadata, JSON.stringify(allMetadata));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error updating metadata for conversation ${conversationId}:`, error);
      return false;
    }
  }
  
  /**
   * Export all conversations as a JSON file
   */
  exportAllConversations() {
    try {
      // Get all conversation metadata
      const allMetadata = this.getAllConversationMetadata();
      
      // Create export object
      const exportData = {
        metadata: allMetadata,
        conversations: {}
      };
      
      // Add conversation data
      allMetadata.forEach(meta => {
        const conversation = this.getConversation(meta.id);
        if (conversation) {
          exportData.conversations[meta.id] = conversation;
        }
      });
      
      // Create JSON blob
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdt_ai_conversations_${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting conversations:', error);
      return false;
    }
  }
  
  /**
   * Import conversations from a JSON file
   * 
   * @param {File} file - JSON file to import
   * @returns {Promise} - Promise resolving to import result
   */
  importConversations(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const importData = JSON.parse(event.target.result);
            
            // Validate import data
            if (!importData.metadata || !Array.isArray(importData.metadata) || !importData.conversations) {
              reject(new Error('Invalid import file format'));
              return;
            }
            
            // Import conversations
            let importCount = 0;
            
            importData.metadata.forEach(meta => {
              // Check if conversation data exists
              if (importData.conversations[meta.id]) {
                // Save conversation
                this.saveConversation(meta.id, importData.conversations[meta.id]);
                
                // Save metadata
                this.saveConversationMetadata(meta);
                
                importCount++;
              }
            });
            
            resolve({ success: true, count: importCount });
          } catch (error) {
            reject(new Error('Error parsing import file: ' + error.message));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading import file'));
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Create and export a singleton instance
const chatService = new ChatService();
export default chatService; 