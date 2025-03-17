/**
 * Persona Manager
 * 
 * Manages AI personas and their configuration.
 */

import premiumPersonasManager from '../utils/premium-personas.js';
import creditsManager from '../utils/credits-manager.js';

class PersonaManager {
  constructor() {
    // Storage key for active persona
    this.storageKey = 'pdt_ai_active_persona';
    
    // Storage key for custom personas
    this.customPersonasKey = 'pdt_ai_custom_personas';
    
    // Active persona ID
    this.activePersonaId = null;
    
    // Default personas
    this.defaultPersonas = {
      default: {
        id: 'default',
        name: 'Default Assistant',
        description: 'A helpful, balanced AI assistant',
        systemPrompt: 'You are a helpful AI assistant. Provide accurate, concise, and useful responses.',
        icon: 'robot',
        category: 'general'
      },
      efficient: {
        id: 'efficient',
        name: 'Efficient Assistant',
        description: 'Optimized for token efficiency and direct responses',
        systemPrompt: 'You are an AI assistant focused on providing concise, direct answers with minimal token usage. Be brief but complete. Avoid unnecessary explanations, pleasantries, or verbose language.',
        icon: 'bolt',
        category: 'general'
      },
      professional: {
        id: 'professional',
        name: 'Professional Assistant',
        description: 'Formal and business-appropriate communication style',
        systemPrompt: 'You are a professional AI assistant with expertise in business communication. Provide well-structured, formal responses that are appropriate for a professional context. Use clear, precise language and maintain a respectful tone.',
        icon: 'briefcase',
        category: 'business'
      },
      creative: {
        id: 'creative',
        name: 'Creative Assistant',
        description: 'Imaginative and engaging communication style',
        systemPrompt: 'You are a creative AI assistant with a flair for imaginative and engaging communication. Feel free to use metaphors, storytelling techniques, and vivid language to make your responses memorable and inspiring.',
        icon: 'lightbulb',
        category: 'creative'
      },
      technical: {
        id: 'technical',
        name: 'Technical Assistant',
        description: 'Specialized in technical and programming topics',
        systemPrompt: 'You are a technical AI assistant with expertise in programming, software development, and technical topics. Provide detailed, accurate technical information. Include code examples when relevant, and explain technical concepts clearly.',
        icon: 'code',
        category: 'technical'
      }
    };
    
    // Custom personas
    this.customPersonas = {};
    
    // Premium personas cache
    this.premiumPersonasCache = {};
    
    // Load saved persona and custom personas
    this.loadSavedPersona();
    this.loadCustomPersonas();
    this.cachePremiumPersonas();
  }
  
  /**
   * Cache premium personas for easier access
   */
  cachePremiumPersonas() {
    const premiumPersonas = premiumPersonasManager.getAllPremiumPersonas();
    
    premiumPersonas.forEach(persona => {
      this.premiumPersonasCache[persona.id] = {
        ...persona,
        category: 'premium',
        icon: 'star'
      };
    });
  }
  
  /**
   * Load saved active persona from local storage
   */
  loadSavedPersona() {
    try {
      const savedPersonaId = localStorage.getItem(this.storageKey);
      
      if (savedPersonaId) {
        // Check if persona exists
        const allPersonas = this.getAllPersonas();
        const personaExists = allPersonas.some(persona => persona.id === savedPersonaId);
        
        if (personaExists) {
          this.activePersonaId = savedPersonaId;
        } else {
          // If persona doesn't exist, use default
          this.activePersonaId = 'default';
          this.saveActivePersona();
        }
      } else {
        // If no saved persona, use default
        this.activePersonaId = 'default';
        this.saveActivePersona();
      }
    } catch (error) {
      console.error('Error loading saved persona:', error);
      this.activePersonaId = 'default';
    }
  }
  
  /**
   * Save active persona to local storage
   */
  saveActivePersona() {
    try {
      localStorage.setItem(this.storageKey, this.activePersonaId);
    } catch (error) {
      console.error('Error saving active persona:', error);
    }
  }
  
  /**
   * Get all available personas
   * 
   * @returns {Array} - Array of persona objects
   */
  getAllPersonas() {
    // Combine default and custom personas
    const allPersonas = [
      ...Object.values(this.defaultPersonas),
      ...Object.values(this.customPersonas)
    ];
    
    // Add available premium personas
    const availablePremiumPersonas = this.getAvailablePremiumPersonas();
    allPersonas.push(...availablePremiumPersonas);
    
    // Sort by category and name
    return allPersonas.sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category);
    });
  }
  
  /**
   * Get available premium personas
   * 
   * @returns {Array} - Array of available premium persona objects
   */
  getAvailablePremiumPersonas() {
    // Get all premium personas
    const premiumPersonas = Object.values(this.premiumPersonasCache);
    
    // Filter to only include available ones
    return premiumPersonas.filter(persona => {
      return premiumPersonasManager.isPersonaAvailable(persona.id);
    });
  }
  
  /**
   * Get all premium personas (including locked ones)
   * 
   * @returns {Array} - Array of all premium persona objects
   */
  getAllPremiumPersonas() {
    return Object.values(this.premiumPersonasCache);
  }
  
  /**
   * Get personas by category
   * 
   * @param {string} category - Category to filter by
   * @returns {Array} - Array of persona objects in the category
   */
  getPersonasByCategory(category) {
    if (!category) return this.getAllPersonas();
    
    return this.getAllPersonas().filter(persona => persona.category === category);
  }
  
  /**
   * Get a persona by ID
   * 
   * @param {string} personaId - ID of the persona to get
   * @returns {Object|null} - Persona object or null if not found
   */
  getPersona(personaId) {
    if (!personaId) return null;
    
    // Check default personas
    if (this.defaultPersonas[personaId]) {
      return this.defaultPersonas[personaId];
    }
    
    // Check custom personas
    if (this.customPersonas[personaId]) {
      return this.customPersonas[personaId];
    }
    
    // Check premium personas
    if (this.premiumPersonasCache[personaId]) {
      return this.premiumPersonasCache[personaId];
    }
    
    return null;
  }
  
  /**
   * Get the active persona
   * 
   * @returns {Object} - Active persona object
   */
  getActivePersona() {
    return this.getPersona(this.activePersonaId) || this.defaultPersonas.default;
  }
  
  /**
   * Set the active persona
   * 
   * @param {string} personaId - ID of the persona to set as active
   * @returns {boolean} - True if successful
   */
  setActivePersona(personaId) {
    // Check if persona exists
    const persona = this.getPersona(personaId);
    
    if (!persona) {
      console.error(`Persona with ID ${personaId} not found`);
      return false;
    }
    
    // Check if premium persona is available
    if (this.premiumPersonasCache[personaId]) {
      // Try to use the premium persona
      if (!premiumPersonasManager.usePersona(personaId)) {
        // If can't use, show insufficient credits notification
        this.showInsufficientCreditsNotification(persona);
        return false;
      }
    }
    
    // Set active persona
    this.activePersonaId = personaId;
    
    // Save to local storage
    this.saveActivePersona();
    
    // Update UI
    this.updatePersonaUI();
    
    // Award credits for using a new persona (once per session)
    if (!this.usedPersonas) {
      this.usedPersonas = new Set();
    }
    
    if (!this.usedPersonas.has(personaId)) {
      this.usedPersonas.add(personaId);
      
      // Only award credits for the second and subsequent persona changes
      if (this.usedPersonas.size > 1) {
        creditsManager.awardActivityCredits('personaChange');
      }
    }
    
    return true;
  }
  
  /**
   * Show insufficient credits notification
   * 
   * @param {Object} persona - Persona that couldn't be used
   */
  showInsufficientCreditsNotification(persona) {
    const cost = creditsManager.getFeatureCost('advancedPersona');
    const balance = creditsManager.getBalance();
    
    alert(`You don't have enough credits to use ${persona.name}. You need ${cost} credits, but you only have ${balance} credits.`);
  }
  
  /**
   * Add a new custom persona
   * 
   * @param {Object} persona - Persona object to add
   * @returns {boolean} - True if successful
   */
  addPersona(persona) {
    if (!persona || !persona.id || !persona.name || !persona.systemPrompt) {
      console.error('Invalid persona object');
      return false;
    }
    
    // Check if custom persona creation is available
    if (persona.id === 'new' && !this.canCreateCustomPersona()) {
      this.showCustomPersonaCreationUnavailable();
      return false;
    }
    
    // Generate ID if not provided
    if (persona.id === 'new') {
      persona.id = `custom_${Date.now()}`;
    }
    
    // Check if ID already exists
    if (this.defaultPersonas[persona.id] || this.customPersonas[persona.id] || this.premiumPersonasCache[persona.id]) {
      console.error(`Persona with ID ${persona.id} already exists`);
      return false;
    }
    
    // Set default category if not provided
    if (!persona.category) {
      persona.category = 'custom';
    }
    
    // Set default icon if not provided
    if (!persona.icon) {
      persona.icon = 'user';
    }
    
    // Add to custom personas
    this.customPersonas[persona.id] = persona;
    
    // Save custom personas
    this.saveCustomPersonas();
    
    // Award credits for creating a custom persona
    creditsManager.awardActivityCredits('customPersonaCreation');
    
    return true;
  }
  
  /**
   * Check if user can create a custom persona
   * 
   * @returns {boolean} - True if user can create a custom persona
   */
  canCreateCustomPersona() {
    // Count existing custom personas
    const customPersonaCount = Object.keys(this.customPersonas).length;
    
    // Free users can create up to 2 custom personas
    if (customPersonaCount < 2) {
      return true;
    }
    
    // Check if user has premium access to custom persona creation
    return creditsManager.hasFeatureAccess('unlockCustomPersona');
  }
  
  /**
   * Show notification that custom persona creation is unavailable
   */
  showCustomPersonaCreationUnavailable() {
    alert('You have reached the limit of custom personas for free users. Upgrade to Pro to create unlimited custom personas, or use credits to unlock this feature.');
  }
  
  /**
   * Update an existing custom persona
   * 
   * @param {string} personaId - ID of the persona to update
   * @param {Object} updates - Object with fields to update
   * @returns {boolean} - True if successful
   */
  updatePersona(personaId, updates) {
    // Check if persona exists and is custom
    if (!this.customPersonas[personaId]) {
      console.error(`Custom persona with ID ${personaId} not found`);
      return false;
    }
    
    // Update persona
    this.customPersonas[personaId] = {
      ...this.customPersonas[personaId],
      ...updates
    };
    
    // Save custom personas
    this.saveCustomPersonas();
    
    // Update UI if this is the active persona
    if (this.activePersonaId === personaId) {
      this.updatePersonaUI();
    }
    
    return true;
  }
  
  /**
   * Delete a custom persona
   * 
   * @param {string} personaId - ID of the persona to delete
   * @returns {boolean} - True if successful
   */
  deletePersona(personaId) {
    // Check if persona exists and is custom
    if (!this.customPersonas[personaId]) {
      console.error(`Custom persona with ID ${personaId} not found or is not a custom persona`);
      return false;
    }
    
    // If this is the active persona, switch to default
    if (this.activePersonaId === personaId) {
      this.setActivePersona('default');
    }
    
    // Delete persona
    delete this.customPersonas[personaId];
    
    // Save custom personas
    this.saveCustomPersonas();
    
    return true;
  }
  
  /**
   * Save custom personas to local storage
   */
  saveCustomPersonas() {
    try {
      localStorage.setItem(this.customPersonasKey, JSON.stringify(this.customPersonas));
    } catch (error) {
      console.error('Error saving custom personas:', error);
    }
  }
  
  /**
   * Load custom personas from local storage
   */
  loadCustomPersonas() {
    try {
      const savedPersonas = localStorage.getItem(this.customPersonasKey);
      
      if (savedPersonas) {
        this.customPersonas = JSON.parse(savedPersonas);
      }
    } catch (error) {
      console.error('Error loading custom personas:', error);
      this.customPersonas = {};
    }
  }
  
  /**
   * Update the persona UI
   */
  updatePersonaUI() {
    // Get active persona
    const activePersona = this.getActivePersona();
    
    // Update persona selector if it exists
    const personaSelector = document.getElementById('persona-selector');
    if (personaSelector) {
      personaSelector.value = activePersona.id;
    }
    
    // Update persona display if it exists
    const personaDisplay = document.getElementById('active-persona');
    if (personaDisplay) {
      personaDisplay.textContent = activePersona.name;
    }
    
    // Update persona icon if it exists
    const personaIcon = document.getElementById('active-persona-icon');
    if (personaIcon) {
      personaIcon.className = `fas fa-${activePersona.icon}`;
      
      // Add premium class if it's a premium persona
      if (this.premiumPersonasCache[activePersona.id]) {
        personaIcon.classList.add('premium-persona-icon');
      } else {
        personaIcon.classList.remove('premium-persona-icon');
      }
    }
  }
  
  /**
   * Initialize the persona selector in the UI
   */
  initializePersonaSelector() {
    // Get persona selector
    const personaSelector = document.getElementById('persona-selector');
    if (!personaSelector) return;
    
    // Clear existing options
    personaSelector.innerHTML = '';
    
    // Get all personas
    const allPersonas = this.getAllPersonas();
    
    // Group personas by category
    const personasByCategory = {};
    
    allPersonas.forEach(persona => {
      if (!personasByCategory[persona.category]) {
        personasByCategory[persona.category] = [];
      }
      
      personasByCategory[persona.category].push(persona);
    });
    
    // Add options for each category
    Object.keys(personasByCategory).sort().forEach(category => {
      // Create optgroup
      const optgroup = document.createElement('optgroup');
      optgroup.label = this.formatCategoryName(category);
      
      // Add options for personas in this category
      personasByCategory[category].forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.id;
        option.textContent = persona.name;
        option.title = persona.description;
        
        // Add premium class if it's a premium persona
        if (this.premiumPersonasCache[persona.id]) {
          option.classList.add('premium-option');
          
          // Check if it's unlocked
          const isPremiumAvailable = premiumPersonasManager.isPersonaAvailable(persona.id);
          if (!isPremiumAvailable) {
            option.classList.add('locked');
          }
        }
        
        // Set selected if this is the active persona
        if (persona.id === this.activePersonaId) {
          option.selected = true;
        }
        
        optgroup.appendChild(option);
      });
      
      personaSelector.appendChild(optgroup);
    });
    
    // Add event listener for changes
    personaSelector.addEventListener('change', () => {
      this.setActivePersona(personaSelector.value);
    });
  }
  
  /**
   * Format category name for display
   * 
   * @param {string} category - Category name
   * @returns {string} - Formatted category name
   */
  formatCategoryName(category) {
    if (!category) return 'Other';
    
    // Special case for premium category
    if (category === 'premium') {
      return '⭐ Premium Personas';
    }
    
    // Capitalize first letter and replace underscores with spaces
    return category.charAt(0).toUpperCase() + 
           category.slice(1).replace(/_/g, ' ');
  }
  
  /**
   * Show premium personas UI
   * 
   * @param {string} containerId - ID of the container element
   */
  showPremiumPersonasUI(containerId) {
    premiumPersonasManager.createPersonasUI(containerId, (persona) => {
      // When a persona is selected, set it as active
      this.setActivePersona(persona.id);
    });
  }
}

// Create and export a singleton instance
const personaManager = new PersonaManager();
export default personaManager; 