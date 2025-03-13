/**
 * Token Counter Utility
 * 
 * Provides functions for estimating token usage for OpenAI API calls.
 * This is a simplified implementation that uses character count as a rough approximation.
 * For more accurate token counting, a proper tokenizer like GPT-3 Tokenizer would be needed.
 */

class TokenCounter {
  constructor() {
    // Token cost per 1000 tokens for different models (in USD)
    this.tokenCosts = {
      'gpt-3.5-turbo': {
        prompt: 0.0015,
        completion: 0.002
      },
      'gpt-4': {
        prompt: 0.03,
        completion: 0.06
      },
      'gpt-4-turbo': {
        prompt: 0.01,
        completion: 0.03
      }
    };
    
    // Default model to use for cost calculations
    this.defaultModel = 'gpt-3.5-turbo';
    
    // Storage key for token usage data
    this.storageKey = 'pdt_ai_token_usage';
    
    // Load token usage data from storage
    this.loadTokenUsageData();
  }
  
  /**
   * Load token usage data from local storage
   */
  loadTokenUsageData() {
    try {
      const usageData = localStorage.getItem(this.storageKey);
      this.tokenUsage = usageData ? JSON.parse(usageData) : {};
    } catch (error) {
      console.error('Error loading token usage data:', error);
      this.tokenUsage = {};
    }
  }
  
  /**
   * Save token usage data to local storage
   */
  saveTokenUsageData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tokenUsage));
    } catch (error) {
      console.error('Error saving token usage data:', error);
    }
  }
  
  /**
   * Estimate token count for a string
   * 
   * This is a simplified approximation. For more accurate results,
   * a proper tokenizer should be used.
   * 
   * @param {string} text - Text to estimate token count for
   * @returns {number} - Estimated token count
   */
  estimateTokenCount(text) {
    if (!text) return 0;
    
    // Simple approximation: 1 token ≈ 4 characters
    // This is a rough estimate and will vary based on the actual text
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Estimate token count for a message
   * 
   * @param {Object} message - Message object with role and content
   * @returns {number} - Estimated token count
   */
  estimateMessageTokens(message) {
    if (!message || !message.content) return 0;
    
    // Base tokens for message metadata (role, etc.)
    const baseTokens = 4;
    
    // Content tokens
    const contentTokens = this.estimateTokenCount(message.content);
    
    return baseTokens + contentTokens;
  }
  
  /**
   * Estimate token count for a conversation
   * 
   * @param {Array} messages - Array of message objects
   * @returns {number} - Estimated total token count
   */
  estimateConversationTokens(messages) {
    if (!messages || !Array.isArray(messages)) return 0;
    
    // Base tokens for conversation metadata
    const baseTokens = 2;
    
    // Sum tokens for all messages
    const messageTokens = messages.reduce((total, message) => {
      return total + this.estimateMessageTokens(message);
    }, 0);
    
    return baseTokens + messageTokens;
  }
  
  /**
   * Record token usage for a conversation
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {Object} usage - Token usage object with prompt_tokens, completion_tokens, total_tokens
   * @param {string} model - Model used for the request
   */
  recordTokenUsage(conversationId, usage, model = this.defaultModel) {
    if (!conversationId || !usage) return;
    
    // Initialize conversation usage if not exists
    if (!this.tokenUsage[conversationId]) {
      this.tokenUsage[conversationId] = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: model
      };
    }
    
    // Update token counts
    this.tokenUsage[conversationId].promptTokens += usage.prompt_tokens || 0;
    this.tokenUsage[conversationId].completionTokens += usage.completion_tokens || 0;
    this.tokenUsage[conversationId].totalTokens += usage.total_tokens || 0;
    this.tokenUsage[conversationId].model = model;
    
    // Save updated usage data
    this.saveTokenUsageData();
  }
  
  /**
   * Get token usage for a conversation
   * 
   * @param {string} conversationId - ID of the conversation
   * @returns {Object|null} - Token usage object or null if not found
   */
  getConversationTokenUsage(conversationId) {
    if (!conversationId) return null;
    
    return this.tokenUsage[conversationId] || null;
  }
  
  /**
   * Get total token usage across all conversations
   * 
   * @returns {Object} - Total token usage object
   */
  getTotalTokenUsage() {
    const total = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
    
    // Sum token usage across all conversations
    Object.values(this.tokenUsage).forEach(usage => {
      total.promptTokens += usage.promptTokens || 0;
      total.completionTokens += usage.completionTokens || 0;
      total.totalTokens += usage.totalTokens || 0;
    });
    
    return total;
  }
  
  /**
   * Calculate cost for token usage
   * 
   * @param {Object} usage - Token usage object with promptTokens, completionTokens, totalTokens
   * @param {string} model - Model to calculate cost for
   * @returns {Object} - Cost object with promptCost, completionCost, totalCost
   */
  calculateCost(usage, model = this.defaultModel) {
    if (!usage) return { promptCost: 0, completionCost: 0, totalCost: 0 };
    
    // Get cost rates for the model
    const costRates = this.tokenCosts[model] || this.tokenCosts[this.defaultModel];
    
    // Calculate costs
    const promptCost = (usage.promptTokens / 1000) * costRates.prompt;
    const completionCost = (usage.completionTokens / 1000) * costRates.completion;
    const totalCost = promptCost + completionCost;
    
    return {
      promptCost,
      completionCost,
      totalCost
    };
  }
  
  /**
   * Reset token usage data
   */
  resetTokenUsage() {
    this.tokenUsage = {};
    this.saveTokenUsageData();
  }
}

// Create and export a singleton instance
const tokenCounter = new TokenCounter();
export default tokenCounter; 