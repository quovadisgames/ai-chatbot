/**
 * Chat Initialization
 * 
 * Main entry point for initializing the chat functionality.
 */

import conversationManager from './conversation-manager.js';
import personaManager from './persona-manager.js';
import messageHandler from './message-handler.js';
import chatService from '../api/chat-service.js';
import tokenOptimizer from '../utils/token-optimizer.js';
import creditsManager from '../utils/credits-manager.js';
import premiumPersonasManager from '../utils/premium-personas.js';

/**
 * Initialize the chat functionality
 */
function initializeChat() {
  // Check if API key is set
  checkApiKey();
  
  // Initialize persona manager
  personaManager.loadCustomPersonas();
  personaManager.initializePersonaSelector();
  
  // Initialize conversation manager
  conversationManager.initialize();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize token optimization
  initializeTokenOptimization();
  
  // Initialize credits system
  initializeCreditsSystem();
  
  // Initialize premium personas
  initializePremiumPersonas();
  
  console.log('Chat functionality initialized');
}

/**
 * Initialize credits system
 */
function initializeCreditsSystem() {
  // Create credits display in the header
  creditsManager.createCreditsDisplay('credits-display-container');
  
  // Set up credits notification system
  setupCreditsNotifications();
  
  // Award credits for daily login
  // This is handled automatically in the CreditsManager constructor
}

/**
 * Set up credits notifications
 */
function setupCreditsNotifications() {
  // Listen for credits update events
  document.addEventListener('creditsUpdate', (event) => {
    if (event.detail) {
      const { type, data, balance } = event.detail;
      
      // Show notification for certain events
      if (['earned', 'spent', 'dailyBonus', 'insufficient'].includes(type)) {
        showCreditsNotification(type, data, balance);
      }
    }
  });
}

/**
 * Show credits notification
 * 
 * @param {string} type - Type of credits update
 * @param {Object} data - Data about the update
 * @param {number} balance - Current balance
 */
function showCreditsNotification(type, data, balance) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'credits-notification';
  
  // Set content based on type
  let title = '';
  let amount = '';
  let icon = '💎';
  
  switch (type) {
    case 'earned':
      title = `Credits Earned: ${data.reason}`;
      amount = `+${data.amount}`;
      notification.innerHTML = `
        <div class="credits-notification-icon">${icon}</div>
        <div class="credits-notification-content">
          <div class="credits-notification-title">${title}</div>
          <div class="credits-notification-amount positive">${amount}</div>
        </div>
      `;
      break;
      
    case 'spent':
      title = `Credits Spent: ${data.reason}`;
      amount = `-${data.amount}`;
      notification.innerHTML = `
        <div class="credits-notification-icon">${icon}</div>
        <div class="credits-notification-content">
          <div class="credits-notification-title">${title}</div>
          <div class="credits-notification-amount negative">${amount}</div>
        </div>
      `;
      notification.classList.add('negative');
      break;
      
    case 'dailyBonus':
      title = 'Daily Login Bonus';
      amount = `+${data.amount}`;
      if (data.consecutive > 1) {
        title += ` (${data.consecutive} days streak)`;
      }
      notification.innerHTML = `
        <div class="credits-notification-icon">✨</div>
        <div class="credits-notification-content">
          <div class="credits-notification-title">${title}</div>
          <div class="credits-notification-amount positive">${amount}</div>
        </div>
      `;
      break;
      
    case 'insufficient':
      title = `Not Enough Credits: ${data.reason}`;
      amount = `Need ${data.amount} (You have ${data.balance})`;
      notification.innerHTML = `
        <div class="credits-notification-icon">⚠️</div>
        <div class="credits-notification-content">
          <div class="credits-notification-title">${title}</div>
          <div class="credits-notification-amount negative">${amount}</div>
        </div>
      `;
      notification.classList.add('negative');
      break;
  }
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after animation completes
  setTimeout(() => {
    notification.remove();
  }, 3500);
}

/**
 * Initialize premium personas
 */
function initializePremiumPersonas() {
  // Show premium personas in the sidebar
  personaManager.showPremiumPersonasUI('premium-personas-container');
  
  // Add event listener for message interactions to award credits
  document.addEventListener('messageSent', () => {
    creditsManager.awardActivityCredits('messageInteraction');
  });
  
  // Add event listener for feedback to award credits
  document.addEventListener('feedbackProvided', () => {
    creditsManager.awardActivityCredits('feedbackProvided');
  });
}

/**
 * Initialize token optimization features
 */
function initializeTokenOptimization() {
  // Set up optimization toggle button
  const optimizationToggle = document.getElementById('optimization-toggle');
  const optimizationContainer = document.getElementById('optimization-container');
  
  if (optimizationToggle && optimizationContainer) {
    optimizationToggle.addEventListener('click', () => {
      const isVisible = optimizationContainer.style.display !== 'none';
      optimizationContainer.style.display = isVisible ? 'none' : 'block';
      
      // Update dashboard when showing
      if (!isVisible) {
        const activePersona = personaManager.getActivePersona();
        if (activePersona) {
          tokenOptimizer.createTokenSavingsDashboard('optimization-container', activePersona.id);
        }
      }
    });
  }
  
  // Listen for persona changes to update optimization data
  document.addEventListener('personaChanged', (event) => {
    if (event.detail && event.detail.personaId) {
      // Update optimization dashboard if visible
      if (optimizationContainer && optimizationContainer.style.display !== 'none') {
        tokenOptimizer.createTokenSavingsDashboard('optimization-container', event.detail.personaId);
      }
    }
  });
  
  // Add chat rules to settings dialog
  const rulesButton = document.querySelector('.rules-button');
  if (rulesButton) {
    rulesButton.addEventListener('click', () => {
      showChatRulesDialog();
    });
  }
}

/**
 * Show chat rules dialog with token optimization options
 */
function showChatRulesDialog() {
  const rulesModal = document.querySelector('.chat-rules-modal');
  if (!rulesModal) return;
  
  // Get chat rules from token optimizer
  const chatRules = tokenOptimizer.chatRules;
  
  // Update rules content
  const rulesContent = rulesModal.querySelector('.chat-rules-content');
  if (rulesContent) {
    rulesContent.innerHTML = `
      <div class="rule-group">
        <label>Response Length:</label>
        <div class="rule-options">
          <button class="rule-option ${chatRules.shortAnswers.enabled ? 'selected' : ''}" data-rule="shortAnswers">Short</button>
          <button class="rule-option ${!chatRules.shortAnswers.enabled && !chatRules.detailedExplanations.enabled ? 'selected' : ''}" data-rule="medium">Medium</button>
          <button class="rule-option ${chatRules.detailedExplanations.enabled ? 'selected' : ''}" data-rule="detailedExplanations">Detailed</button>
        </div>
      </div>
      
      <div class="rule-group">
        <label>Code Snippets:</label>
        <div class="rule-options">
          <button class="rule-option ${chatRules.codeSnippets.enabled ? 'selected' : ''}" data-rule="codeSnippets">Include</button>
          <button class="rule-option ${!chatRules.codeSnippets.enabled ? 'selected' : ''}" data-rule="noCode">Exclude</button>
        </div>
      </div>
      
      <div class="rule-group">
        <label>Token Efficiency:</label>
        <div class="token-efficiency-display">
          <div class="efficiency-label">Current Settings Efficiency:</div>
          <div class="efficiency-value">
            ${Math.round((1 - tokenOptimizer.calculateRulesTokenImpact()) * 100)}% token savings
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners to rule options
    const ruleOptions = rulesContent.querySelectorAll('.rule-option');
    ruleOptions.forEach(option => {
      option.addEventListener('click', (event) => {
        const rule = event.target.dataset.rule;
        
        // Update selected state in UI
        const optionGroup = event.target.closest('.rule-options');
        optionGroup.querySelectorAll('.rule-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Update rules in token optimizer
        updateChatRules(rule);
      });
    });
  }
  
  // Show the modal
  rulesModal.style.display = 'block';
  
  // Add close button event listener
  const closeButton = rulesModal.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      rulesModal.style.display = 'none';
    });
  }
  
  // Add apply button event listener
  const applyButton = rulesModal.querySelector('.apply-button');
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      rulesModal.style.display = 'none';
      
      // Update optimization dashboard if visible
      const optimizationContainer = document.getElementById('optimization-container');
      if (optimizationContainer && optimizationContainer.style.display !== 'none') {
        const activePersona = personaManager.getActivePersona();
        if (activePersona) {
          tokenOptimizer.createTokenSavingsDashboard('optimization-container', activePersona.id);
        }
      }
    });
  }
}

/**
 * Update chat rules based on user selection
 * 
 * @param {string} rule - The rule that was selected
 */
function updateChatRules(rule) {
  switch (rule) {
    case 'shortAnswers':
      tokenOptimizer.toggleChatRule('shortAnswers', true);
      tokenOptimizer.toggleChatRule('detailedExplanations', false);
      break;
      
    case 'medium':
      tokenOptimizer.toggleChatRule('shortAnswers', false);
      tokenOptimizer.toggleChatRule('detailedExplanations', false);
      break;
      
    case 'detailedExplanations':
      tokenOptimizer.toggleChatRule('shortAnswers', false);
      tokenOptimizer.toggleChatRule('detailedExplanations', true);
      break;
      
    case 'codeSnippets':
      tokenOptimizer.toggleChatRule('codeSnippets', true);
      break;
      
    case 'noCode':
      tokenOptimizer.toggleChatRule('codeSnippets', false);
      break;
  }
  
  // Update efficiency display
  const efficiencyValue = document.querySelector('.efficiency-value');
  if (efficiencyValue) {
    efficiencyValue.textContent = `${Math.round((1 - tokenOptimizer.calculateRulesTokenImpact()) * 100)}% token savings`;
  }
}

/**
 * Check if API key is set and show prompt if not
 */
function checkApiKey() {
  if (!chatService.hasApiKey()) {
    // Show API key prompt after a short delay
    setTimeout(() => {
      promptForApiKey();
    }, 1000);
  }
}

/**
 * Prompt user for OpenAI API key
 */
function promptForApiKey() {
  const apiKey = prompt(
    'Please enter your OpenAI API key to use the chat functionality.\n' +
    'You can get an API key from https://platform.openai.com/api-keys'
  );
  
  if (apiKey && apiKey.trim() !== '') {
    // Save API key
    chatService.saveApiKey(apiKey.trim());
    alert('API key saved. You can now use the chat functionality.');
  } else {
    // Show warning
    alert('No API key provided. Chat functionality will be limited.');
  }
}

/**
 * Set up event listeners for chat functionality
 */
function setupEventListeners() {
  // Chat form submission
  const chatForm = document.getElementById('message-form');
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }
  
  // Settings button
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', showSettingsDialog);
  }
  
  // API key update button
  const updateApiKeyButton = document.getElementById('update-api-key-button');
  if (updateApiKeyButton) {
    updateApiKeyButton.addEventListener('click', promptForApiKey);
  }
}

/**
 * Handle chat form submission
 * 
 * @param {Event} event - Form submission event
 */
function handleChatSubmit(event) {
  event.preventDefault();
  
  // Get message input
  const messageInput = document.getElementById('message-input');
  if (!messageInput) return;
  
  // Get message text
  const messageText = messageInput.value.trim();
  if (messageText === '') return;
  
  // Clear input
  messageInput.value = '';
  
  // Get active persona
  const activePersona = personaManager.getActivePersona();
  
  // Send message
  messageHandler.sendMessage(messageText, activePersona.id);
  
  // Trigger message sent event for credits
  document.dispatchEvent(new CustomEvent('messageSent'));
}

/**
 * Show settings dialog
 */
function showSettingsDialog() {
  // Check if settings dialog exists
  let settingsDialog = document.getElementById('settings-dialog');
  
  if (!settingsDialog) {
    // Create settings dialog
    settingsDialog = document.createElement('div');
    settingsDialog.id = 'settings-dialog';
    settingsDialog.className = 'dialog';
    
    // Create dialog content
    settingsDialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>Settings</h2>
          <button class="close-button" id="settings-close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="settings-section">
            <h3>API Settings</h3>
            <div class="settings-item">
              <label for="api-key-status">API Key:</label>
              <div class="api-key-status" id="api-key-status">
                ${chatService.hasApiKey() ? 'Set' : 'Not set'}
              </div>
              <button class="button" id="update-api-key-button">
                ${chatService.hasApiKey() ? 'Update' : 'Set'} API Key
              </button>
            </div>
            <div class="settings-item">
              <label for="model-selector">Default Model:</label>
              <select id="model-selector">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          </div>
          <div class="settings-section">
            <h3>Display Settings</h3>
            <div class="settings-item">
              <label for="code-highlighting">Code Highlighting:</label>
              <input type="checkbox" id="code-highlighting" checked>
            </div>
            <div class="settings-item">
              <label for="timestamp-display">Show Timestamps:</label>
              <input type="checkbox" id="timestamp-display" checked>
            </div>
          </div>
          <div class="settings-section">
            <h3>Credits & Premium</h3>
            <div class="settings-item">
              <label>Credits Balance:</label>
              <div class="credits-balance-display">
                <span class="credits-icon">💎</span>
                <span class="credits-amount">${creditsManager.getBalance()}</span>
              </div>
              <button class="button" id="view-transactions-button">View Transactions</button>
            </div>
            <div class="settings-item">
              <label>Premium Status:</label>
              <div class="premium-status-display">
                ${creditsManager.premiumStatus.isPremium ? 
                  `<div class="premium-badge ${creditsManager.premiumStatus.tier}">
                    <span class="premium-icon">⭐</span>
                    <span class="premium-label">${creditsManager.premiumStatus.tier.charAt(0).toUpperCase() + creditsManager.premiumStatus.tier.slice(1)}</span>
                  </div>
                  <div class="premium-expiry">Expires: ${new Date(creditsManager.premiumStatus.expiresAt).toLocaleDateString()}</div>` : 
                  'Free User'}
              </div>
              <button class="button" id="upgrade-account-button">Upgrade Account</button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="button primary" id="settings-save-button">Save</button>
          <button class="button" id="settings-cancel-button">Cancel</button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(settingsDialog);
    
    // Add event listeners
    const closeButton = document.getElementById('settings-close-button');
    const cancelButton = document.getElementById('settings-cancel-button');
    const saveButton = document.getElementById('settings-save-button');
    const updateApiKeyButton = document.getElementById('update-api-key-button');
    const viewTransactionsButton = document.getElementById('view-transactions-button');
    const upgradeAccountButton = document.getElementById('upgrade-account-button');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        settingsDialog.style.display = 'none';
      });
    }
    
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        settingsDialog.style.display = 'none';
      });
    }
    
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // Save settings
        saveSettings();
        settingsDialog.style.display = 'none';
      });
    }
    
    if (updateApiKeyButton) {
      updateApiKeyButton.addEventListener('click', () => {
        promptForApiKey();
        
        // Update API key status
        const apiKeyStatus = document.getElementById('api-key-status');
        if (apiKeyStatus) {
          apiKeyStatus.textContent = chatService.hasApiKey() ? 'Set' : 'Not set';
        }
      });
    }
    
    if (viewTransactionsButton) {
      viewTransactionsButton.addEventListener('click', () => {
        showTransactionsDialog();
      });
    }
    
    if (upgradeAccountButton) {
      upgradeAccountButton.addEventListener('click', () => {
        creditsManager.showUpgradeDialog();
      });
    }
  } else {
    // Update credits balance
    const creditsAmount = settingsDialog.querySelector('.credits-amount');
    if (creditsAmount) {
      creditsAmount.textContent = creditsManager.getBalance();
    }
    
    // Update premium status
    const premiumStatusDisplay = settingsDialog.querySelector('.premium-status-display');
    if (premiumStatusDisplay) {
      premiumStatusDisplay.innerHTML = creditsManager.premiumStatus.isPremium ? 
        `<div class="premium-badge ${creditsManager.premiumStatus.tier}">
          <span class="premium-icon">⭐</span>
          <span class="premium-label">${creditsManager.premiumStatus.tier.charAt(0).toUpperCase() + creditsManager.premiumStatus.tier.slice(1)}</span>
        </div>
        <div class="premium-expiry">Expires: ${new Date(creditsManager.premiumStatus.expiresAt).toLocaleDateString()}</div>` : 
        'Free User';
    }
  }
  
  // Show dialog
  settingsDialog.style.display = 'flex';
}

/**
 * Show transactions dialog
 */
function showTransactionsDialog() {
  // Check if transactions dialog exists
  let transactionsDialog = document.getElementById('transactions-dialog');
  
  if (!transactionsDialog) {
    // Create transactions dialog
    transactionsDialog = document.createElement('div');
    transactionsDialog.id = 'transactions-dialog';
    transactionsDialog.className = 'dialog';
    
    // Create dialog content
    transactionsDialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>Credits Transactions</h2>
          <button class="close-button" id="transactions-close-button">×</button>
        </div>
        <div class="dialog-body">
          <div class="credits-summary">
            <div class="credits-balance-large">
              <div class="credits-icon">💎</div>
              <div class="credits-amount">${creditsManager.getBalance()}</div>
              <div class="credits-label">Current Balance</div>
            </div>
            <div class="credits-lifetime">
              <div class="lifetime-amount">${creditsManager.getLifetimeCredits()}</div>
              <div class="lifetime-label">Lifetime Credits</div>
            </div>
          </div>
          
          <div class="transaction-history">
            <h3>Recent Transactions</h3>
            <div class="transaction-list">
              ${getTransactionsHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(transactionsDialog);
    
    // Add event listeners
    const closeButton = document.getElementById('transactions-close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        transactionsDialog.style.display = 'none';
      });
    }
  } else {
    // Update transactions list
    const transactionList = transactionsDialog.querySelector('.transaction-list');
    if (transactionList) {
      transactionList.innerHTML = getTransactionsHTML();
    }
    
    // Update credits balance
    const creditsAmount = transactionsDialog.querySelector('.credits-amount');
    if (creditsAmount) {
      creditsAmount.textContent = creditsManager.getBalance();
    }
    
    // Update lifetime credits
    const lifetimeAmount = transactionsDialog.querySelector('.lifetime-amount');
    if (lifetimeAmount) {
      lifetimeAmount.textContent = creditsManager.getLifetimeCredits();
    }
  }
  
  // Show dialog
  transactionsDialog.style.display = 'flex';
}

/**
 * Get HTML for transactions list
 * 
 * @returns {string} - HTML for transactions list
 */
function getTransactionsHTML() {
  const transactions = creditsManager.getTransactionHistory(20);
  
  if (transactions.length === 0) {
    return '<div class="no-transactions">No transactions yet</div>';
  }
  
  return transactions.map(transaction => {
    const date = new Date(transaction.timestamp).toLocaleString();
    const amountClass = transaction.amount >= 0 ? 'earn' : 'spend';
    const amountPrefix = transaction.amount >= 0 ? '+' : '';
    
    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-date">${date}</div>
        </div>
        <div class="transaction-amount ${amountClass}">${amountPrefix}${transaction.amount}</div>
      </div>
    `;
  }).join('');
}

/**
 * Save settings from dialog
 */
function saveSettings() {
  // Get settings values
  const modelSelector = document.getElementById('model-selector');
  const codeHighlighting = document.getElementById('code-highlighting');
  const timestampDisplay = document.getElementById('timestamp-display');
  
  // Save model preference
  if (modelSelector) {
    localStorage.setItem('pdt_ai_default_model', modelSelector.value);
  }
  
  // Save display preferences
  if (codeHighlighting) {
    localStorage.setItem('pdt_ai_code_highlighting', codeHighlighting.checked);
  }
  
  if (timestampDisplay) {
    localStorage.setItem('pdt_ai_timestamp_display', timestampDisplay.checked);
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChat);

// Export functions for external use
export { initializeChat }; 