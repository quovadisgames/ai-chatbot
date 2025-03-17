/**
 * Premium Personas Manager
 * 
 * Manages premium personas that can be unlocked with credits
 * or accessed with premium subscription.
 */

import creditsManager from './credits-manager.js';

class PremiumPersonasManager {
  constructor() {
    this.premiumPersonas = [
      {
        id: 'expert-coder',
        name: 'Expert Coder',
        description: 'Specialized in providing detailed code solutions with extensive explanations and best practices.',
        avatar: 'assets/avatars/expert-coder.png',
        cost: 25,
        tier: 'basic',
        unlocked: false,
        systemPrompt: `You are Expert Coder, a senior software engineer with 15+ years of experience across multiple languages and frameworks. 
Your responses should include:
- Detailed, production-ready code solutions
- Thorough explanations of your implementation choices
- Best practices and design patterns
- Potential edge cases and how to handle them
- Performance considerations
Always format your code properly with syntax highlighting and include comments for complex sections.`
      },
      {
        id: 'data-scientist',
        name: 'Data Scientist',
        description: 'Specialized in data analysis, statistics, and machine learning with visualization capabilities.',
        avatar: 'assets/avatars/data-scientist.png',
        cost: 25,
        tier: 'basic',
        unlocked: false,
        systemPrompt: `You are Data Scientist, an expert in data analysis, statistics, and machine learning.
Your responses should include:
- Clear explanations of statistical concepts and machine learning algorithms
- Code examples in Python using libraries like pandas, numpy, scikit-learn, and TensorFlow
- Data visualization suggestions and code
- Interpretation of results and insights
- Best practices for data preprocessing and model evaluation
Always consider statistical significance and potential biases in your analysis.`
      },
      {
        id: 'startup-advisor',
        name: 'Startup Advisor',
        description: 'Provides strategic business advice for startups, including fundraising, growth, and product development.',
        avatar: 'assets/avatars/startup-advisor.png',
        cost: 25,
        tier: 'basic',
        unlocked: false,
        systemPrompt: `You are Startup Advisor, a seasoned entrepreneur and venture capitalist with experience founding and investing in multiple successful startups.
Your responses should include:
- Strategic business advice tailored to early-stage startups
- Insights on fundraising, pitching to investors, and term sheets
- Growth strategies and go-to-market approaches
- Product development and prioritization frameworks
- Team building and company culture development
Always consider the stage of the startup and provide actionable, practical advice.`
      },
      {
        id: 'creative-writer',
        name: 'Creative Writer',
        description: 'Helps with creative writing, storytelling, and content creation with a focus on engaging narratives.',
        avatar: 'assets/avatars/creative-writer.png',
        cost: 50,
        tier: 'pro',
        unlocked: false,
        systemPrompt: `You are Creative Writer, an accomplished novelist and content creator with expertise in storytelling and narrative design.
Your responses should include:
- Engaging and vivid prose with attention to sensory details
- Character development and compelling dialogue
- Plot structure and narrative arc guidance
- Creative writing techniques and literary devices
- Editing suggestions and style improvements
Always aim to evoke emotion and create immersive experiences through your writing.`
      },
      {
        id: 'design-expert',
        name: 'Design Expert',
        description: 'Provides UI/UX design guidance, visual design principles, and design system recommendations.',
        avatar: 'assets/avatars/design-expert.png',
        cost: 50,
        tier: 'pro',
        unlocked: false,
        systemPrompt: `You are Design Expert, a senior UI/UX designer with experience creating beautiful, functional interfaces and design systems.
Your responses should include:
- UI/UX design principles and best practices
- Visual design guidance including color theory, typography, and layout
- User research methodologies and usability considerations
- Design system architecture and component design
- Accessibility standards and inclusive design approaches
Always consider the user's needs and the context of use in your design recommendations.`
      },
      {
        id: 'ai-researcher',
        name: 'AI Researcher',
        description: 'Specialized in artificial intelligence concepts, research papers, and cutting-edge AI developments.',
        avatar: 'assets/avatars/ai-researcher.png',
        cost: 75,
        tier: 'pro',
        unlocked: false,
        systemPrompt: `You are AI Researcher, a PhD-level expert in artificial intelligence with deep knowledge of machine learning, neural networks, and AI research.
Your responses should include:
- In-depth explanations of AI concepts and algorithms
- Summaries and analyses of recent research papers
- Implementation details for advanced AI techniques
- Ethical considerations and limitations of AI systems
- Future directions and emerging trends in AI research
Always strive for technical accuracy while making complex concepts accessible.`
      }
    ];
    
    // Load unlocked personas from localStorage
    this.loadUnlockedPersonas();
  }
  
  /**
   * Load unlocked personas from localStorage
   */
  loadUnlockedPersonas() {
    try {
      const unlockedPersonas = localStorage.getItem('pdt_ai_unlocked_personas');
      if (unlockedPersonas) {
        const unlockedIds = JSON.parse(unlockedPersonas);
        
        // Mark personas as unlocked
        this.premiumPersonas.forEach(persona => {
          if (unlockedIds.includes(persona.id)) {
            persona.unlocked = true;
          }
        });
      }
    } catch (error) {
      console.error('Error loading unlocked personas:', error);
    }
  }
  
  /**
   * Save unlocked personas to localStorage
   */
  saveUnlockedPersonas() {
    try {
      const unlockedIds = this.premiumPersonas
        .filter(persona => persona.unlocked)
        .map(persona => persona.id);
      
      localStorage.setItem('pdt_ai_unlocked_personas', JSON.stringify(unlockedIds));
    } catch (error) {
      console.error('Error saving unlocked personas:', error);
    }
  }
  
  /**
   * Get all premium personas
   * 
   * @returns {Array} - Array of premium persona objects
   */
  getAllPremiumPersonas() {
    return this.premiumPersonas;
  }
  
  /**
   * Get available premium personas based on user's premium status
   * 
   * @returns {Array} - Array of available premium persona objects
   */
  getAvailablePersonas() {
    const isPremium = creditsManager.premiumStatus.isPremium;
    const premiumTier = creditsManager.premiumStatus.tier;
    
    return this.premiumPersonas.filter(persona => {
      // If persona is already unlocked, it's available
      if (persona.unlocked) {
        return true;
      }
      
      // If user is premium, check tier
      if (isPremium) {
        if (premiumTier === 'pro') {
          // Pro users have access to all personas
          return true;
        } else if (premiumTier === 'basic') {
          // Basic users have access to basic tier personas
          return persona.tier === 'basic';
        }
      }
      
      // Not available
      return false;
    });
  }
  
  /**
   * Get a premium persona by ID
   * 
   * @param {string} personaId - ID of the persona to get
   * @returns {Object|null} - Persona object or null if not found
   */
  getPersonaById(personaId) {
    return this.premiumPersonas.find(persona => persona.id === personaId) || null;
  }
  
  /**
   * Check if a persona is available for use
   * 
   * @param {string} personaId - ID of the persona to check
   * @returns {boolean} - Whether the persona is available
   */
  isPersonaAvailable(personaId) {
    const persona = this.getPersonaById(personaId);
    if (!persona) return false;
    
    // If persona is unlocked, it's available
    if (persona.unlocked) return true;
    
    // Check premium status
    const isPremium = creditsManager.premiumStatus.isPremium;
    const premiumTier = creditsManager.premiumStatus.tier;
    
    if (isPremium) {
      if (premiumTier === 'pro') {
        // Pro users have access to all personas
        return true;
      } else if (premiumTier === 'basic' && persona.tier === 'basic') {
        // Basic users have access to basic tier personas
        return true;
      }
    }
    
    // Check if user can afford one-time use
    return creditsManager.canAffordFeature('advancedPersona');
  }
  
  /**
   * Unlock a premium persona permanently
   * 
   * @param {string} personaId - ID of the persona to unlock
   * @returns {boolean} - Whether the unlock was successful
   */
  unlockPersona(personaId) {
    const persona = this.getPersonaById(personaId);
    if (!persona) return false;
    
    // If already unlocked, return success
    if (persona.unlocked) return true;
    
    // Try to spend credits to unlock
    if (creditsManager.spendCredits(persona.cost, `Unlock ${persona.name} persona`)) {
      persona.unlocked = true;
      this.saveUnlockedPersonas();
      return true;
    }
    
    return false;
  }
  
  /**
   * Use a premium persona for one conversation
   * 
   * @param {string} personaId - ID of the persona to use
   * @returns {boolean} - Whether the use was successful
   */
  usePersona(personaId) {
    const persona = this.getPersonaById(personaId);
    if (!persona) return false;
    
    // If persona is unlocked, it's free to use
    if (persona.unlocked) return true;
    
    // Check premium status
    const isPremium = creditsManager.premiumStatus.isPremium;
    const premiumTier = creditsManager.premiumStatus.tier;
    
    if (isPremium) {
      if (premiumTier === 'pro') {
        // Pro users have access to all personas
        return true;
      } else if (premiumTier === 'basic' && persona.tier === 'basic') {
        // Basic users have access to basic tier personas
        return true;
      }
    }
    
    // Try to spend credits for one-time use
    return creditsManager.usePremiumFeature('advancedPersona');
  }
  
  /**
   * Create premium personas UI
   * 
   * @param {string} containerId - ID of the container element
   * @param {Function} onSelectPersona - Callback when a persona is selected
   */
  createPersonasUI(containerId, onSelectPersona) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create premium personas section
    const premiumSection = document.createElement('div');
    premiumSection.className = 'premium-personas-section';
    
    // Add section title
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Premium Personas';
    premiumSection.appendChild(sectionTitle);
    
    // Create personas grid
    const personasGrid = document.createElement('div');
    personasGrid.className = 'personas-grid';
    
    // Add each premium persona
    this.premiumPersonas.forEach(persona => {
      const personaCard = document.createElement('div');
      personaCard.className = 'persona-card premium';
      if (persona.unlocked) {
        personaCard.classList.add('unlocked');
      } else {
        personaCard.classList.add('locked');
      }
      
      // Persona avatar
      const avatar = document.createElement('div');
      avatar.className = 'persona-avatar';
      const avatarImg = document.createElement('img');
      avatarImg.src = persona.avatar;
      avatarImg.alt = persona.name;
      avatar.appendChild(avatarImg);
      
      // Premium indicator
      const premiumIndicator = document.createElement('div');
      premiumIndicator.className = 'premium-indicator';
      premiumIndicator.textContent = '⭐';
      avatar.appendChild(premiumIndicator);
      
      personaCard.appendChild(avatar);
      
      // Persona info
      const info = document.createElement('div');
      info.className = 'persona-info';
      
      const name = document.createElement('div');
      name.className = 'persona-name';
      name.textContent = persona.name;
      info.appendChild(name);
      
      const description = document.createElement('div');
      description.className = 'persona-description';
      description.textContent = persona.description;
      info.appendChild(description);
      
      personaCard.appendChild(info);
      
      // Persona actions
      const actions = document.createElement('div');
      actions.className = 'persona-actions';
      
      if (persona.unlocked) {
        // Use button for unlocked personas
        const useButton = document.createElement('button');
        useButton.className = 'persona-use-button';
        useButton.textContent = 'Use';
        useButton.addEventListener('click', () => {
          if (onSelectPersona) {
            onSelectPersona(persona);
          }
        });
        actions.appendChild(useButton);
      } else {
        // Check if available through premium
        const isPremium = creditsManager.premiumStatus.isPremium;
        const premiumTier = creditsManager.premiumStatus.tier;
        let isAvailableThroughPremium = false;
        
        if (isPremium) {
          if (premiumTier === 'pro') {
            isAvailableThroughPremium = true;
          } else if (premiumTier === 'basic' && persona.tier === 'basic') {
            isAvailableThroughPremium = true;
          }
        }
        
        if (isAvailableThroughPremium) {
          // Use button for premium users
          const useButton = document.createElement('button');
          useButton.className = 'persona-use-button';
          useButton.textContent = 'Use';
          useButton.addEventListener('click', () => {
            if (onSelectPersona) {
              onSelectPersona(persona);
            }
          });
          actions.appendChild(useButton);
          
          // Premium badge
          const premiumBadge = document.createElement('div');
          premiumBadge.className = 'premium-access-badge';
          premiumBadge.textContent = 'Premium';
          actions.appendChild(premiumBadge);
        } else {
          // Unlock button for non-premium users
          const unlockButton = document.createElement('button');
          unlockButton.className = 'persona-unlock-button';
          unlockButton.textContent = `Unlock (${persona.cost} 💎)`;
          unlockButton.addEventListener('click', () => {
            this.handleUnlockPersona(persona, onSelectPersona);
          });
          actions.appendChild(unlockButton);
          
          // One-time use button
          const useOnceButton = document.createElement('button');
          useOnceButton.className = 'persona-use-once-button';
          useOnceButton.textContent = `Use Once (${creditsManager.premiumCosts.advancedPersona} 💎)`;
          useOnceButton.addEventListener('click', () => {
            this.handleUseOnce(persona, onSelectPersona);
          });
          actions.appendChild(useOnceButton);
        }
      }
      
      personaCard.appendChild(actions);
      personasGrid.appendChild(personaCard);
    });
    
    premiumSection.appendChild(personasGrid);
    container.appendChild(premiumSection);
  }
  
  /**
   * Handle unlocking a persona
   * 
   * @param {Object} persona - Persona to unlock
   * @param {Function} onSelectPersona - Callback when a persona is selected
   */
  handleUnlockPersona(persona, onSelectPersona) {
    // Check if user can afford to unlock
    if (creditsManager.getBalance() < persona.cost) {
      alert(`Not enough credits. You need ${persona.cost} credits to unlock ${persona.name}.`);
      return;
    }
    
    // Confirm unlock
    if (confirm(`Unlock ${persona.name} permanently for ${persona.cost} credits?`)) {
      if (this.unlockPersona(persona.id)) {
        alert(`Successfully unlocked ${persona.name}!`);
        
        // Refresh UI
        if (onSelectPersona) {
          onSelectPersona(persona);
        }
      } else {
        alert(`Failed to unlock ${persona.name}. Please try again.`);
      }
    }
  }
  
  /**
   * Handle using a persona once
   * 
   * @param {Object} persona - Persona to use
   * @param {Function} onSelectPersona - Callback when a persona is selected
   */
  handleUseOnce(persona, onSelectPersona) {
    // Check if user can afford to use
    const cost = creditsManager.premiumCosts.advancedPersona;
    if (creditsManager.getBalance() < cost) {
      alert(`Not enough credits. You need ${cost} credits to use ${persona.name} for one conversation.`);
      return;
    }
    
    // Confirm use
    if (confirm(`Use ${persona.name} for one conversation for ${cost} credits?`)) {
      if (this.usePersona(persona.id)) {
        // Refresh UI
        if (onSelectPersona) {
          onSelectPersona(persona);
        }
      } else {
        alert(`Failed to use ${persona.name}. Please try again.`);
      }
    }
  }
}

// Create and export a singleton instance
const premiumPersonasManager = new PremiumPersonasManager();
export default premiumPersonasManager; 