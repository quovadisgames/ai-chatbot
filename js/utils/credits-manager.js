/**
 * Credits Manager
 * 
 * Manages the AI Credits system, which is the soft currency used in the application.
 * Handles earning, spending, and tracking of credits.
 */

class CreditsManager {
  constructor() {
    // Default starting credits for new users
    this.defaultStartingCredits = 100;
    
    // Credit earning rates
    this.earningRates = {
      dailyLogin: 10,           // Credits earned for daily login
      consecutiveLogin: 5,       // Additional credits for consecutive days
      messageInteraction: 1,     // Credits earned per message interaction
      feedbackProvided: 5,       // Credits earned for providing feedback
      weeklyUsage: 20,           // Credits earned for using the app multiple days in a week
      sharingConversation: 15    // Credits earned for sharing a conversation
    };
    
    // Credit costs for premium features
    this.premiumCosts = {
      advancedPersona: 25,       // Cost to use an advanced persona for one conversation
      unlockCustomPersona: 150,  // Cost to permanently unlock a custom persona slot
      priorityProcessing: 10,    // Cost for priority processing of a message
      longerContext: 20,         // Cost for extended context window in a conversation
      exportConversation: 5,     // Cost to export a conversation in premium format
      advancedFormatting: 15     // Cost to use advanced formatting options
    };
    
    // User's credit balance and history
    this.userCredits = {
      balance: 0,
      lifetime: 0,
      lastLogin: null,
      consecutiveLogins: 0,
      transactions: []
    };
    
    // Premium status
    this.premiumStatus = {
      isPremium: false,
      tier: 'free',
      expiresAt: null,
      features: []
    };
    
    // Load user credits from localStorage
    this.loadCredits();
    
    // Check for daily login bonus
    this.checkDailyLoginBonus();
  }
  
  /**
   * Load credits from localStorage
   */
  loadCredits() {
    try {
      const savedCredits = localStorage.getItem('pdt_ai_credits');
      if (savedCredits) {
        this.userCredits = JSON.parse(savedCredits);
      } else {
        // First time user, set default credits
        this.userCredits.balance = this.defaultStartingCredits;
        this.userCredits.lifetime = this.defaultStartingCredits;
        this.addTransaction('initial', 'Welcome bonus', this.defaultStartingCredits);
        this.saveCredits();
      }
      
      const savedPremium = localStorage.getItem('pdt_ai_premium');
      if (savedPremium) {
        this.premiumStatus = JSON.parse(savedPremium);
        
        // Check if premium has expired
        if (this.premiumStatus.expiresAt && new Date(this.premiumStatus.expiresAt) < new Date()) {
          this.premiumStatus.isPremium = false;
          this.premiumStatus.tier = 'free';
          this.saveCredits();
        }
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      // Reset to defaults on error
      this.userCredits.balance = this.defaultStartingCredits;
      this.userCredits.lifetime = this.defaultStartingCredits;
    }
  }
  
  /**
   * Save credits to localStorage
   */
  saveCredits() {
    try {
      localStorage.setItem('pdt_ai_credits', JSON.stringify(this.userCredits));
      localStorage.setItem('pdt_ai_premium', JSON.stringify(this.premiumStatus));
    } catch (error) {
      console.error('Error saving credits:', error);
    }
  }
  
  /**
   * Check for daily login bonus
   */
  checkDailyLoginBonus() {
    const today = new Date().toDateString();
    
    if (this.userCredits.lastLogin !== today) {
      // It's a new day, give login bonus
      let bonus = this.earningRates.dailyLogin;
      
      // Check if this is a consecutive day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (this.userCredits.lastLogin === yesterdayString) {
        // Consecutive login
        this.userCredits.consecutiveLogins++;
        bonus += this.earningRates.consecutiveLogin;
      } else {
        // Reset consecutive logins
        this.userCredits.consecutiveLogins = 1;
      }
      
      // Add bonus
      this.addCredits(bonus, 'Daily login bonus');
      
      // Update last login
      this.userCredits.lastLogin = today;
      this.saveCredits();
      
      // Trigger event for UI update
      this.triggerCreditsEvent('dailyBonus', { amount: bonus, consecutive: this.userCredits.consecutiveLogins });
    }
  }
  
  /**
   * Add credits to user's balance
   * 
   * @param {number} amount - Amount of credits to add
   * @param {string} reason - Reason for adding credits
   */
  addCredits(amount, reason) {
    if (amount <= 0) return;
    
    this.userCredits.balance += amount;
    this.userCredits.lifetime += amount;
    
    this.addTransaction('earn', reason, amount);
    this.saveCredits();
    
    // Trigger event for UI update
    this.triggerCreditsEvent('earned', { amount, reason });
  }
  
  /**
   * Spend credits from user's balance
   * 
   * @param {number} amount - Amount of credits to spend
   * @param {string} reason - Reason for spending credits
   * @returns {boolean} - Whether the transaction was successful
   */
  spendCredits(amount, reason) {
    if (amount <= 0) return true;
    
    // Check if user has enough credits
    if (this.userCredits.balance < amount) {
      // Trigger event for insufficient credits
      this.triggerCreditsEvent('insufficient', { amount, reason, balance: this.userCredits.balance });
      return false;
    }
    
    this.userCredits.balance -= amount;
    
    this.addTransaction('spend', reason, -amount);
    this.saveCredits();
    
    // Trigger event for UI update
    this.triggerCreditsEvent('spent', { amount, reason });
    return true;
  }
  
  /**
   * Add a transaction to the history
   * 
   * @param {string} type - Transaction type ('earn', 'spend', 'initial')
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount (positive for earning, negative for spending)
   */
  addTransaction(type, description, amount) {
    this.userCredits.transactions.push({
      type,
      description,
      amount,
      timestamp: new Date().toISOString(),
      balance: this.userCredits.balance
    });
    
    // Limit transaction history to last 100 transactions
    if (this.userCredits.transactions.length > 100) {
      this.userCredits.transactions = this.userCredits.transactions.slice(-100);
    }
  }
  
  /**
   * Get user's current credit balance
   * 
   * @returns {number} - Current credit balance
   */
  getBalance() {
    return this.userCredits.balance;
  }
  
  /**
   * Get user's lifetime credits earned
   * 
   * @returns {number} - Lifetime credits earned
   */
  getLifetimeCredits() {
    return this.userCredits.lifetime;
  }
  
  /**
   * Get user's transaction history
   * 
   * @param {number} limit - Maximum number of transactions to return
   * @returns {Array} - Array of transaction objects
   */
  getTransactionHistory(limit = 10) {
    return this.userCredits.transactions.slice(-limit).reverse();
  }
  
  /**
   * Check if user can afford a premium feature
   * 
   * @param {string} featureId - ID of the premium feature
   * @returns {boolean} - Whether the user can afford the feature
   */
  canAffordFeature(featureId) {
    // If user is premium, they can use all features
    if (this.premiumStatus.isPremium) {
      return true;
    }
    
    // Check if feature exists in premium costs
    if (this.premiumCosts[featureId]) {
      return this.userCredits.balance >= this.premiumCosts[featureId];
    }
    
    return false;
  }
  
  /**
   * Use a premium feature
   * 
   * @param {string} featureId - ID of the premium feature
   * @returns {boolean} - Whether the feature was successfully used
   */
  usePremiumFeature(featureId) {
    // If user is premium, they can use all features without spending credits
    if (this.premiumStatus.isPremium) {
      return true;
    }
    
    // Check if feature exists in premium costs
    if (this.premiumCosts[featureId]) {
      return this.spendCredits(this.premiumCosts[featureId], `Used ${featureId}`);
    }
    
    return false;
  }
  
  /**
   * Set user's premium status
   * 
   * @param {boolean} isPremium - Whether the user is premium
   * @param {string} tier - Premium tier ('free', 'basic', 'pro')
   * @param {Date} expiresAt - When the premium status expires
   */
  setPremiumStatus(isPremium, tier = 'basic', expiresAt = null) {
    this.premiumStatus.isPremium = isPremium;
    this.premiumStatus.tier = tier;
    this.premiumStatus.expiresAt = expiresAt ? expiresAt.toISOString() : null;
    
    // Set available features based on tier
    switch (tier) {
      case 'basic':
        this.premiumStatus.features = [
          'advancedPersona',
          'exportConversation',
          'longerContext'
        ];
        break;
      case 'pro':
        this.premiumStatus.features = [
          'advancedPersona',
          'unlockCustomPersona',
          'priorityProcessing',
          'longerContext',
          'exportConversation',
          'advancedFormatting'
        ];
        break;
      default:
        this.premiumStatus.features = [];
    }
    
    this.saveCredits();
    
    // Trigger event for UI update
    this.triggerCreditsEvent('premiumChanged', { isPremium, tier });
  }
  
  /**
   * Check if user has access to a premium feature
   * 
   * @param {string} featureId - ID of the premium feature
   * @returns {boolean} - Whether the user has access to the feature
   */
  hasFeatureAccess(featureId) {
    // Check if user is premium and has this feature
    if (this.premiumStatus.isPremium && this.premiumStatus.features.includes(featureId)) {
      return true;
    }
    
    // Check if user has enough credits for one-time use
    return this.canAffordFeature(featureId);
  }
  
  /**
   * Get cost of a premium feature
   * 
   * @param {string} featureId - ID of the premium feature
   * @returns {number} - Cost of the feature in credits, or 0 if user is premium
   */
  getFeatureCost(featureId) {
    // If user is premium and has this feature, it's free
    if (this.premiumStatus.isPremium && this.premiumStatus.features.includes(featureId)) {
      return 0;
    }
    
    // Return cost from premium costs
    return this.premiumCosts[featureId] || 0;
  }
  
  /**
   * Award credits for user activity
   * 
   * @param {string} activityType - Type of activity ('messageInteraction', 'feedbackProvided', etc.)
   */
  awardActivityCredits(activityType) {
    if (this.earningRates[activityType]) {
      this.addCredits(this.earningRates[activityType], `${activityType} reward`);
    }
  }
  
  /**
   * Trigger a credits event
   * 
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  triggerCreditsEvent(eventType, data) {
    const event = new CustomEvent('creditsUpdate', {
      detail: {
        type: eventType,
        data: data,
        balance: this.userCredits.balance
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Create a credits display element
   * 
   * @param {string} containerId - ID of the container element
   */
  createCreditsDisplay(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create credits display HTML
    const displayHTML = `
      <div class="credits-display">
        <div class="credits-balance">
          <div class="credits-icon">💎</div>
          <div class="credits-amount">${this.userCredits.balance}</div>
        </div>
        ${this.premiumStatus.isPremium ? 
          `<div class="premium-badge ${this.premiumStatus.tier}">
            <span class="premium-icon">⭐</span>
            <span class="premium-label">${this.premiumStatus.tier.charAt(0).toUpperCase() + this.premiumStatus.tier.slice(1)}</span>
          </div>` : 
          `<button class="upgrade-button">Upgrade</button>`
        }
      </div>
    `;
    
    // Set display HTML
    container.innerHTML = displayHTML;
    
    // Add event listener for upgrade button
    const upgradeButton = container.querySelector('.upgrade-button');
    if (upgradeButton) {
      upgradeButton.addEventListener('click', () => {
        this.showUpgradeDialog();
      });
    }
    
    // Listen for credits updates
    document.addEventListener('creditsUpdate', () => {
      const creditsAmount = container.querySelector('.credits-amount');
      if (creditsAmount) {
        creditsAmount.textContent = this.userCredits.balance;
        
        // Add animation class
        creditsAmount.classList.add('credits-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          creditsAmount.classList.remove('credits-updated');
        }, 1000);
      }
    });
  }
  
  /**
   * Show upgrade dialog
   */
  showUpgradeDialog() {
    // Check if dialog already exists
    let upgradeDialog = document.getElementById('upgrade-dialog');
    
    if (!upgradeDialog) {
      // Create upgrade dialog
      upgradeDialog = document.createElement('div');
      upgradeDialog.id = 'upgrade-dialog';
      upgradeDialog.className = 'dialog';
      
      // Create dialog content
      upgradeDialog.innerHTML = `
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>Upgrade to Premium</h2>
            <button class="close-button" id="upgrade-close-button">×</button>
          </div>
          <div class="dialog-body">
            <div class="premium-tiers">
              <div class="premium-tier-card free">
                <div class="tier-header">
                  <h3>Free</h3>
                  <div class="tier-price">0 credits</div>
                </div>
                <div class="tier-features">
                  <div class="tier-feature">✅ Basic chat functionality</div>
                  <div class="tier-feature">✅ Standard personas</div>
                  <div class="tier-feature">✅ 1:1 conversations</div>
                  <div class="tier-feature">✅ Basic token optimization</div>
                </div>
                <div class="tier-footer">
                  <button class="tier-button current">Current Plan</button>
                </div>
              </div>
              
              <div class="premium-tier-card basic">
                <div class="tier-header">
                  <h3>Basic</h3>
                  <div class="tier-price">500 credits</div>
                </div>
                <div class="tier-features">
                  <div class="tier-feature">✅ All Free features</div>
                  <div class="tier-feature">✅ Advanced personas</div>
                  <div class="tier-feature">✅ Export conversations</div>
                  <div class="tier-feature">✅ Longer context window</div>
                </div>
                <div class="tier-footer">
                  <button class="tier-button upgrade" data-tier="basic">Upgrade</button>
                </div>
              </div>
              
              <div class="premium-tier-card pro">
                <div class="tier-header">
                  <h3>Pro</h3>
                  <div class="tier-price">1000 credits</div>
                </div>
                <div class="tier-features">
                  <div class="tier-feature">✅ All Basic features</div>
                  <div class="tier-feature">✅ Custom persona creation</div>
                  <div class="tier-feature">✅ Priority processing</div>
                  <div class="tier-feature">✅ Advanced formatting</div>
                </div>
                <div class="tier-footer">
                  <button class="tier-button upgrade" data-tier="pro">Upgrade</button>
                </div>
              </div>
            </div>
            
            <div class="credits-info">
              <h3>Your Credits</h3>
              <div class="credits-balance-large">
                <div class="credits-icon">💎</div>
                <div class="credits-amount">${this.userCredits.balance}</div>
              </div>
              <div class="credits-earn-info">
                <h4>Ways to Earn Credits</h4>
                <div class="earn-method">✨ Daily login: ${this.earningRates.dailyLogin} credits</div>
                <div class="earn-method">✨ Consecutive login: +${this.earningRates.consecutiveLogin} credits</div>
                <div class="earn-method">✨ Message interaction: ${this.earningRates.messageInteraction} credit per message</div>
                <div class="earn-method">✨ Provide feedback: ${this.earningRates.feedbackProvided} credits</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(upgradeDialog);
      
      // Add event listeners
      const closeButton = upgradeDialog.querySelector('#upgrade-close-button');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          upgradeDialog.style.display = 'none';
        });
      }
      
      // Add event listeners for upgrade buttons
      const upgradeButtons = upgradeDialog.querySelectorAll('.tier-button.upgrade');
      upgradeButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tier = button.dataset.tier;
          this.handleUpgrade(tier);
          upgradeDialog.style.display = 'none';
        });
      });
    }
    
    // Update credits amount
    const creditsAmount = upgradeDialog.querySelector('.credits-amount');
    if (creditsAmount) {
      creditsAmount.textContent = this.userCredits.balance;
    }
    
    // Show dialog
    upgradeDialog.style.display = 'flex';
  }
  
  /**
   * Handle upgrade to premium
   * 
   * @param {string} tier - Premium tier to upgrade to
   */
  handleUpgrade(tier) {
    let cost = 0;
    
    // Set cost based on tier
    switch (tier) {
      case 'basic':
        cost = 500;
        break;
      case 'pro':
        cost = 1000;
        break;
      default:
        return;
    }
    
    // Check if user has enough credits
    if (this.userCredits.balance < cost) {
      alert(`Not enough credits. You need ${cost} credits to upgrade to ${tier}.`);
      return;
    }
    
    // Spend credits
    if (this.spendCredits(cost, `Upgrade to ${tier}`)) {
      // Set premium status
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days premium
      
      this.setPremiumStatus(true, tier, expiresAt);
      
      alert(`Successfully upgraded to ${tier} tier! Your premium status will expire in 30 days.`);
    }
  }
}

// Create and export a singleton instance
const creditsManager = new CreditsManager();
export default creditsManager; 