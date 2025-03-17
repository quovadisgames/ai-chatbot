/**
 * Token Optimizer
 * 
 * Provides utilities for tracking, comparing, and optimizing token usage across different personas.
 * Helps visualize token savings and provides optimization suggestions.
 */

import tokenCounter from './token-counter.js';
import personaManager from '../chat/persona-manager.js';

class TokenOptimizer {
  constructor() {
    // Store token usage history by persona
    this.personaTokenHistory = {};
    
    // Baseline token usage for comparison (standard GPT-4 without optimization)
    this.baselineTokenRate = {
      promptTokens: 1.0,    // Multiplier for standard prompt tokens
      completionTokens: 1.0  // Multiplier for standard completion tokens
    };
    
    // Efficiency ratings for built-in personas (relative to baseline)
    this.personaEfficiency = {
      'default': { promptTokens: 1.0, completionTokens: 1.0, description: 'Standard efficiency' },
      'efficient': { promptTokens: 0.9, completionTokens: 0.7, description: 'Optimized for brevity and efficiency' },
      'professional': { promptTokens: 1.1, completionTokens: 0.9, description: 'Balanced efficiency with professional detail' },
      'creative': { promptTokens: 1.2, completionTokens: 1.3, description: 'Optimized for creative detail, not token efficiency' },
      'technical': { promptTokens: 1.1, completionTokens: 0.8, description: 'Efficient technical responses with necessary detail' }
    };
    
    // Chat rules and their impact on token usage
    this.chatRules = {
      shortAnswers: {
        enabled: false,
        tokenImpact: 0.7,  // Reduces completion tokens by 30%
        description: 'Generates shorter, more concise responses'
      },
      codeSnippets: {
        enabled: true,
        tokenImpact: 1.0,  // No impact on token usage
        description: 'Includes code snippets in responses when relevant'
      },
      detailedExplanations: {
        enabled: true,
        tokenImpact: 1.3,  // Increases completion tokens by 30%
        description: 'Provides more detailed explanations and context'
      }
    };
    
    // Initialize from localStorage if available
    this.loadSettings();
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      // Load persona token history
      const savedHistory = localStorage.getItem('personaTokenHistory');
      if (savedHistory) {
        this.personaTokenHistory = JSON.parse(savedHistory);
      }
      
      // Load chat rules
      const savedRules = localStorage.getItem('chatRules');
      if (savedRules) {
        this.chatRules = JSON.parse(savedRules);
      }
    } catch (error) {
      console.error('Error loading token optimizer settings:', error);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('personaTokenHistory', JSON.stringify(this.personaTokenHistory));
      localStorage.setItem('chatRules', JSON.stringify(this.chatRules));
    } catch (error) {
      console.error('Error saving token optimizer settings:', error);
    }
  }
  
  /**
   * Record token usage for a specific persona
   * 
   * @param {string} personaId - ID of the persona used
   * @param {Object} tokenUsage - Token usage object (promptTokens, completionTokens, totalTokens)
   * @param {string} model - Model used for the conversation
   */
  recordPersonaTokenUsage(personaId, tokenUsage, model) {
    if (!personaId || !tokenUsage) return;
    
    // Initialize persona history if not exists
    if (!this.personaTokenHistory[personaId]) {
      this.personaTokenHistory[personaId] = {
        totalUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        interactions: 0,
        models: {}
      };
    }
    
    // Update total usage
    this.personaTokenHistory[personaId].totalUsage.promptTokens += tokenUsage.promptTokens || 0;
    this.personaTokenHistory[personaId].totalUsage.completionTokens += tokenUsage.completionTokens || 0;
    this.personaTokenHistory[personaId].totalUsage.totalTokens += tokenUsage.totalTokens || 0;
    
    // Increment interactions count
    this.personaTokenHistory[personaId].interactions += 1;
    
    // Update model-specific usage
    if (model) {
      if (!this.personaTokenHistory[personaId].models[model]) {
        this.personaTokenHistory[personaId].models[model] = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          interactions: 0
        };
      }
      
      this.personaTokenHistory[personaId].models[model].promptTokens += tokenUsage.promptTokens || 0;
      this.personaTokenHistory[personaId].models[model].completionTokens += tokenUsage.completionTokens || 0;
      this.personaTokenHistory[personaId].models[model].totalTokens += tokenUsage.totalTokens || 0;
      this.personaTokenHistory[personaId].models[model].interactions += 1;
    }
    
    // Save updated history
    this.saveSettings();
  }
  
  /**
   * Get average token usage for a specific persona
   * 
   * @param {string} personaId - ID of the persona
   * @returns {Object} - Average token usage object
   */
  getAverageTokenUsage(personaId) {
    if (!personaId || !this.personaTokenHistory[personaId]) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      };
    }
    
    const history = this.personaTokenHistory[personaId];
    const interactions = Math.max(1, history.interactions); // Avoid division by zero
    
    return {
      promptTokens: Math.round(history.totalUsage.promptTokens / interactions),
      completionTokens: Math.round(history.totalUsage.completionTokens / interactions),
      totalTokens: Math.round(history.totalUsage.totalTokens / interactions)
    };
  }
  
  /**
   * Get token savings compared to baseline for a specific persona
   * 
   * @param {string} personaId - ID of the persona
   * @returns {Object} - Token savings object with percentages
   */
  getTokenSavings(personaId) {
    // Get persona efficiency ratings
    const efficiency = this.getPersonaEfficiency(personaId);
    
    // Calculate savings percentages
    const promptSavings = Math.round((1 - efficiency.promptTokens) * 100);
    const completionSavings = Math.round((1 - efficiency.completionTokens) * 100);
    
    // Calculate overall savings
    // Weight completion tokens more as they typically cost more
    const overallSavings = Math.round((1 - ((efficiency.promptTokens + efficiency.completionTokens * 2) / 3)) * 100);
    
    return {
      promptSavings,
      completionSavings,
      overallSavings
    };
  }
  
  /**
   * Get efficiency rating for a specific persona
   * 
   * @param {string} personaId - ID of the persona
   * @returns {Object} - Efficiency rating object
   */
  getPersonaEfficiency(personaId) {
    // Get persona from persona manager
    const persona = personaManager.getPersona(personaId);
    
    // Use built-in efficiency ratings if available
    if (this.personaEfficiency[personaId]) {
      return this.personaEfficiency[personaId];
    }
    
    // For custom personas, estimate based on system prompt length and complexity
    if (persona && persona.systemPrompt) {
      const promptLength = persona.systemPrompt.length;
      
      // Simple heuristic: longer system prompts tend to produce more verbose responses
      let completionFactor = 1.0;
      
      if (promptLength < 100) {
        completionFactor = 0.8; // Short prompts tend to produce concise responses
      } else if (promptLength > 500) {
        completionFactor = 1.2; // Long prompts tend to produce verbose responses
      }
      
      // Check for efficiency keywords in the system prompt
      const promptLower = persona.systemPrompt.toLowerCase();
      if (promptLower.includes('concise') || promptLower.includes('brief') || promptLower.includes('short')) {
        completionFactor -= 0.2;
      }
      if (promptLower.includes('detailed') || promptLower.includes('thorough') || promptLower.includes('comprehensive')) {
        completionFactor += 0.2;
      }
      
      return {
        promptTokens: 1.0, // System prompt is fixed, so no savings on prompt tokens
        completionTokens: Math.max(0.6, Math.min(1.5, completionFactor)), // Clamp between 0.6 and 1.5
        description: 'Estimated efficiency based on system prompt'
      };
    }
    
    // Default to standard efficiency if no data available
    return {
      promptTokens: 1.0,
      completionTokens: 1.0,
      description: 'Standard efficiency (no optimization data)'
    };
  }
  
  /**
   * Get optimization suggestions for token usage
   * 
   * @param {string} currentPersonaId - ID of the current persona
   * @returns {Array} - Array of suggestion objects
   */
  getOptimizationSuggestions(currentPersonaId) {
    const suggestions = [];
    const currentPersona = personaManager.getPersona(currentPersonaId);
    
    if (!currentPersona) return suggestions;
    
    // Suggest more efficient persona if available
    const allPersonas = personaManager.getAllPersonas();
    const moreEfficientPersonas = allPersonas.filter(persona => {
      if (persona.id === currentPersonaId) return false;
      
      const currentEfficiency = this.getPersonaEfficiency(currentPersonaId);
      const otherEfficiency = this.getPersonaEfficiency(persona.id);
      
      // Consider a persona more efficient if it uses at least 15% fewer completion tokens
      return otherEfficiency.completionTokens < currentEfficiency.completionTokens * 0.85;
    });
    
    if (moreEfficientPersonas.length > 0) {
      // Sort by efficiency (most efficient first)
      moreEfficientPersonas.sort((a, b) => {
        return this.getPersonaEfficiency(a.id).completionTokens - this.getPersonaEfficiency(b.id).completionTokens;
      });
      
      // Add suggestion for the most efficient persona
      const mostEfficient = moreEfficientPersonas[0];
      const savings = this.getTokenSavings(mostEfficient.id);
      
      suggestions.push({
        type: 'persona',
        title: `Switch to ${mostEfficient.name}`,
        description: `Save approximately ${savings.overallSavings}% on token usage`,
        action: 'switchPersona',
        actionParams: { personaId: mostEfficient.id }
      });
    }
    
    // Suggest enabling short answers if not enabled
    if (!this.chatRules.shortAnswers.enabled) {
      suggestions.push({
        type: 'rule',
        title: 'Enable Short Answers',
        description: `Save approximately ${Math.round((1 - this.chatRules.shortAnswers.tokenImpact) * 100)}% on completion tokens`,
        action: 'toggleRule',
        actionParams: { rule: 'shortAnswers', enabled: true }
      });
    }
    
    // Suggest disabling detailed explanations if enabled
    if (this.chatRules.detailedExplanations.enabled) {
      suggestions.push({
        type: 'rule',
        title: 'Disable Detailed Explanations',
        description: `Save approximately ${Math.round((this.chatRules.detailedExplanations.tokenImpact - 1) * 100)}% on completion tokens`,
        action: 'toggleRule',
        actionParams: { rule: 'detailedExplanations', enabled: false }
      });
    }
    
    return suggestions;
  }
  
  /**
   * Toggle a chat rule
   * 
   * @param {string} rule - Name of the rule to toggle
   * @param {boolean} enabled - Whether the rule should be enabled
   */
  toggleChatRule(rule, enabled) {
    if (this.chatRules[rule]) {
      this.chatRules[rule].enabled = enabled;
      this.saveSettings();
    }
  }
  
  /**
   * Apply chat rules to a message before sending
   * 
   * @param {string} message - Message to modify
   * @returns {string} - Modified message with chat rules applied
   */
  applyRulesToMessage(message) {
    if (!message) return message;
    
    let modifiedMessage = message;
    
    // Apply short answers rule
    if (this.chatRules.shortAnswers.enabled) {
      modifiedMessage += "\n\nPlease keep your response concise and to the point.";
    }
    
    // Apply code snippets rule
    if (!this.chatRules.codeSnippets.enabled) {
      modifiedMessage += "\n\nPlease avoid including code snippets in your response unless explicitly requested.";
    }
    
    // Apply detailed explanations rule
    if (this.chatRules.detailedExplanations.enabled) {
      modifiedMessage += "\n\nPlease provide detailed explanations and context in your response.";
    } else {
      modifiedMessage += "\n\nPlease focus on direct answers without extensive explanations.";
    }
    
    return modifiedMessage;
  }
  
  /**
   * Calculate the estimated token impact of current chat rules
   * 
   * @returns {number} - Multiplier for token usage based on current rules
   */
  calculateRulesTokenImpact() {
    let impact = 1.0;
    
    // Apply each rule's impact
    if (this.chatRules.shortAnswers.enabled) {
      impact *= this.chatRules.shortAnswers.tokenImpact;
    }
    
    if (this.chatRules.detailedExplanations.enabled) {
      impact *= this.chatRules.detailedExplanations.tokenImpact;
    }
    
    return impact;
  }
  
  /**
   * Create a token savings dashboard element
   * 
   * @param {string} containerId - ID of the container element
   * @param {string} personaId - ID of the current persona
   */
  createTokenSavingsDashboard(containerId, personaId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Get token savings for current persona
    const savings = this.getTokenSavings(personaId);
    
    // Get persona details
    const persona = personaManager.getPersona(personaId);
    const personaName = persona ? persona.name : 'Unknown Persona';
    
    // Get average token usage
    const avgUsage = this.getAverageTokenUsage(personaId);
    
    // Get optimization suggestions
    const suggestions = this.getOptimizationSuggestions(personaId);
    
    // Create dashboard HTML
    const dashboardHTML = `
      <div class="token-savings-dashboard">
        <div class="dashboard-header">
          <h3>Token Optimization Dashboard</h3>
          <div class="current-persona">
            <span class="label">Current Persona:</span>
            <span class="value">${personaName}</span>
          </div>
        </div>
        
        <div class="savings-overview">
          <div class="savings-card overall">
            <div class="savings-value">${savings.overallSavings}%</div>
            <div class="savings-label">Overall Savings</div>
          </div>
          <div class="savings-card prompt">
            <div class="savings-value">${savings.promptSavings}%</div>
            <div class="savings-label">Prompt Savings</div>
          </div>
          <div class="savings-card completion">
            <div class="savings-value">${savings.completionSavings}%</div>
            <div class="savings-label">Completion Savings</div>
          </div>
        </div>
        
        <div class="usage-stats">
          <div class="stats-header">Average Token Usage</div>
          <div class="stats-row">
            <div class="stats-label">Prompt Tokens:</div>
            <div class="stats-value">${avgUsage.promptTokens}</div>
          </div>
          <div class="stats-row">
            <div class="stats-label">Completion Tokens:</div>
            <div class="stats-value">${avgUsage.completionTokens}</div>
          </div>
          <div class="stats-row">
            <div class="stats-label">Total Tokens:</div>
            <div class="stats-value">${avgUsage.totalTokens}</div>
          </div>
        </div>
        
        <div class="optimization-suggestions">
          <div class="suggestions-header">Optimization Suggestions</div>
          ${suggestions.length > 0 ? 
            suggestions.map(suggestion => `
              <div class="suggestion-card ${suggestion.type}">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
                <button class="suggestion-action" data-action="${suggestion.action}" data-params='${JSON.stringify(suggestion.actionParams)}'>
                  Apply
                </button>
              </div>
            `).join('') : 
            '<div class="no-suggestions">No optimization suggestions available</div>'
          }
        </div>
        
        <div class="chat-rules">
          <div class="rules-header">Chat Rules</div>
          <div class="rule-toggle">
            <label for="rule-short-answers">Short Answers</label>
            <div class="toggle-switch">
              <input type="checkbox" id="rule-short-answers" ${this.chatRules.shortAnswers.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
            <div class="rule-description">${this.chatRules.shortAnswers.description}</div>
          </div>
          <div class="rule-toggle">
            <label for="rule-code-snippets">Code Snippets</label>
            <div class="toggle-switch">
              <input type="checkbox" id="rule-code-snippets" ${this.chatRules.codeSnippets.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
            <div class="rule-description">${this.chatRules.codeSnippets.description}</div>
          </div>
          <div class="rule-toggle">
            <label for="rule-detailed-explanations">Detailed Explanations</label>
            <div class="toggle-switch">
              <input type="checkbox" id="rule-detailed-explanations" ${this.chatRules.detailedExplanations.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
            <div class="rule-description">${this.chatRules.detailedExplanations.description}</div>
          </div>
        </div>
      </div>
    `;
    
    // Set dashboard HTML
    container.innerHTML = dashboardHTML;
    
    // Add event listeners for suggestion actions
    const suggestionButtons = container.querySelectorAll('.suggestion-action');
    suggestionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const params = JSON.parse(button.dataset.params);
        
        this.handleSuggestionAction(action, params);
      });
    });
    
    // Add event listeners for rule toggles
    const ruleToggles = container.querySelectorAll('.rule-toggle input[type="checkbox"]');
    ruleToggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        const ruleId = toggle.id.replace('rule-', '').replace(/-/g, '');
        this.toggleChatRule(ruleId, toggle.checked);
        
        // Update dashboard after rule change
        this.createTokenSavingsDashboard(containerId, personaId);
      });
    });
  }
  
  /**
   * Handle suggestion action
   * 
   * @param {string} action - Action to perform
   * @param {Object} params - Action parameters
   */
  handleSuggestionAction(action, params) {
    switch (action) {
      case 'switchPersona':
        if (params.personaId) {
          personaManager.setActivePersona(params.personaId);
          // Trigger event for persona change
          document.dispatchEvent(new CustomEvent('personaChanged', {
            detail: { personaId: params.personaId }
          }));
        }
        break;
        
      case 'toggleRule':
        if (params.rule) {
          this.toggleChatRule(params.rule, params.enabled);
        }
        break;
        
      default:
        console.warn('Unknown suggestion action:', action);
    }
  }
}

// Create and export a singleton instance
const tokenOptimizer = new TokenOptimizer();
export default tokenOptimizer; 