'use client';

import type { Attachment, Message, ChatRequestOptions } from 'ai';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { create } from 'zustand';

// Import hooks and utilities
import { usePersona } from '@/hooks/use-persona';
import { fetcher, generateUUID } from '@/lib/utils';
import type { Vote } from '@/lib/db/schema';

// Import components
import { SimpleTokenDisplay } from './simple-token-display';
import { VisibilityType } from './visibility-selector';

// Mock personas for the demo
const MOCK_PERSONAS = [
  {
    id: 'jedi-master-zex',
    character: 'Jedi Master Zex',
    role: 'Mentor',
    responseTime: 'Medium',
    description: 'A wise Jedi Master with centuries of knowledge',
    avatarUrl: '/avatars/jedi-master.png'
  },
  {
    id: 'agent-pd7',
    character: 'Agent PD-7',
    role: 'Scout',
    responseTime: 'Fast',
    description: 'An efficient intelligence-gathering droid',
    avatarUrl: '/avatars/agent.png'
  },
  {
    id: 'support-bot',
    character: 'Support Bot',
    role: 'Engineer',
    responseTime: 'Slow',
    description: 'A technical support assistant with deep knowledge',
    avatarUrl: '/avatars/support.png'
  }
];

// Mock chat history for the demo
const MOCK_CHAT_HISTORY = [
  {
    id: 'chat-1',
    title: 'Chat with Jedi Master Zex',
    date: '2025-03-11',
    preview: 'Discussing the ways of the Force...'
  },
  {
    id: 'chat-2',
    title: 'Mission Briefing with Agent PD-7',
    date: '2025-03-10',
    preview: 'Intelligence gathering on Tatooine...'
  },
  {
    id: 'chat-3',
    title: 'Technical Support Session',
    date: '2025-03-09',
    preview: 'Troubleshooting hyperdrive issues...'
  }
];

// Chat rules store
interface ChatRules {
  responseLength: 'Short' | 'Medium' | 'Long';
  tone: 'Casual' | 'Formal' | 'Technical';
  creativity: number; // 0-100
  isOpen: boolean;
}

const useChatRules = create<ChatRules>(() => ({
  responseLength: 'Medium',
  tone: 'Formal',
  creativity: 70,
  isOpen: false
}));

// Extend the ChatRequestOptions type to include message property
interface ExtendedChatRequestOptions extends ChatRequestOptions {
  message?: string;
}

// Participant interface
interface Participant {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export function Chat({
  chatId,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [messages, setMessages] = useState<Array<Message>>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'ai-assistant', name: 'Jedi Master Zex', role: 'Mentor', avatarUrl: '/avatars/jedi-master.png' }
  ]);
  const [xpPoints, setXpPoints] = useState(10);
  const [xpLevel, setXpLevel] = useState({ rank: 'Novice', progress: 10, max: 100 });
  const [tokenSavings, setTokenSavings] = useState(20); // 20% savings vs standard LLM
  
  // Refs for drag and drop
  const draggedPersona = useRef<any>(null);
  const dropTargetRef = useRef<HTMLDivElement>(null);
  
  // Get the current persona and chat rules
  const { persona } = usePersona();
  const chatRules = useChatRules();
  
  // Calculate token limit based on persona's response time
  const tokenLimit = persona?.responseTime === 'Fast' ? 100 : 
                    persona?.responseTime === 'Medium' ? 250 : 500;
  
  // Track token usage
  const [tokenUsage, setTokenUsage] = useState({
    current: 50, // Mock value for demo
    limit: tokenLimit
  });
  
  // Update token limit when persona changes
  useEffect(() => {
    setTokenUsage(prev => ({
      current: prev.current,
      limit: tokenLimit
    }));
  }, [tokenLimit]);

  // Toggle chat rules modal
  const toggleChatRules = () => {
    useChatRules.setState(state => ({ isOpen: !state.isOpen }));
  };

  // Handle persona drag start
  const handleDragStart = (e: React.DragEvent, persona: any) => {
    draggedPersona.current = persona;
    e.dataTransfer.setData('text/plain', persona.id);
    
    // Add glow effect to dragged element
    const element = e.currentTarget as HTMLElement;
    element.classList.add('dragging');
    
    // Set drag image (optional)
    if (persona.avatarUrl) {
      const img = new Image();
      img.src = persona.avatarUrl;
      e.dataTransfer.setDragImage(img, 15, 15);
    }
  };

  // Handle persona drag end
  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
    draggedPersona.current = null;
  };

  // Handle drop zone drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropTargetRef.current) {
      dropTargetRef.current.classList.add('drop-active');
    }
  };

  // Handle drop zone drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropTargetRef.current) {
      dropTargetRef.current.classList.remove('drop-active');
    }
  };

  // Handle drop zone drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (dropTargetRef.current) {
      dropTargetRef.current.classList.remove('drop-active');
    }
    
    if (draggedPersona.current) {
      // Add persona to participants if not already present
      const personaToAdd = draggedPersona.current;
      if (!participants.some(p => p.id === personaToAdd.id)) {
        setParticipants(prev => [...prev, {
          id: personaToAdd.id,
          name: personaToAdd.character,
          role: personaToAdd.role,
          avatarUrl: personaToAdd.avatarUrl
        }]);
        
        // Show success toast
        toast.success(`Added ${personaToAdd.character} to the chat`);
        
        // Add system message
        const systemMessage: Message = {
          id: generateUUID(),
          content: `${personaToAdd.character} has joined the chat.`,
          role: 'system',
          createdAt: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    }
  };

  // Function to send a message to the API
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    setIsLoading(true);
    
    // Create a new user message
    const userMessage: Message = {
      id: generateUUID(),
      content: message,
      role: 'user',
      createdAt: new Date()
    };
    
    // Add the user message to the state
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input
    setInput('');
    
    // Mock AI response for demo
    setTimeout(() => {
      // Create a mock AI response
      const aiMessage: Message = {
        id: generateUUID(),
        content: generateMockResponse(message, participants),
        role: 'assistant',
        createdAt: new Date()
      };
      
      // Add the AI message to the state
      setMessages(prev => [...prev, aiMessage]);
      
      // Update token usage (mock)
      const newTokenCount = Math.min(tokenUsage.current + 20, tokenLimit);
      setTokenUsage({
        current: newTokenCount,
        limit: tokenLimit
      });
      
      // Update XP
      updateXP(10);
      
      setIsLoading(false);
    }, 1500);
  };
  
  // Generate a mock response based on the message and participants
  const generateMockResponse = (message: string, participants: Participant[]): string => {
    const mainPersona = participants[0];
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return `Greetings! I am ${mainPersona.name}, ${mainPersona.role}. How may I assist you today?`;
    }
    
    if (message.toLowerCase().includes('force')) {
      return 'The Force is what gives a Jedi their power. It\'s an energy field created by all living things. It surrounds us and penetrates us; it binds the galaxy together.';
    }
    
    if (message.toLowerCase().includes('mission') || message.toLowerCase().includes('task')) {
      return 'I have analyzed your mission parameters. The objective appears challenging but achievable with proper planning and execution. Would you like me to outline a strategic approach?';
    }
    
    if (participants.length > 1) {
      const otherPersonas = participants.slice(1);
      const randomPersona = otherPersonas[Math.floor(Math.random() * otherPersonas.length)];
      return `I've consulted with ${randomPersona.name}, and we believe the best course of action would be to gather more intelligence before proceeding. What specific information are you looking for?`;
    }
    
    return 'I have processed your request and am ready to assist. Please provide more details about what you need help with, and I will provide guidance based on my expertise.';
  };
  
  // Update XP points
  const updateXP = (points: number) => {
    const newXP = xpPoints + points;
    setXpPoints(newXP);
    
    // Update level if necessary
    if (newXP >= xpLevel.max) {
      const ranks = ['Novice', 'Initiate', 'Padawan', 'Knight', 'Master'];
      const currentRankIndex = ranks.indexOf(xpLevel.rank);
      const newRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : ranks[currentRankIndex];
      
      setXpLevel({
        rank: newRank,
        progress: newXP - xpLevel.max,
        max: xpLevel.max + 100
      });
      
      toast.success(`Congratulations! You've reached the rank of ${newRank}!`);
    } else {
      setXpLevel(prev => ({
        ...prev,
        progress: newXP
      }));
    }
  };
  
  // Function to handle form submission
  const handleSubmit = (
    e?: { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions
  ) => {
    e?.preventDefault?.();
    // Use type assertion to access the message property
    const messageToSend = (chatRequestOptions as ExtendedChatRequestOptions)?.message || input;
    sendMessage(messageToSend);
  };
  
  // Function to stop the ongoing request
  const stop = () => {
      setIsLoading(false);
    toast.info(`You interrupted the response.`);
  };

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${chatId}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  // Function to append a message to the chat
  const append = async (
    message: Message | { role: string; content: string; }, 
    chatRequestOptions?: ChatRequestOptions
  ): Promise<string | null> => {
    // Create a new message with the correct type
    const newMessage: Message = {
      id: generateUUID(),
      content: message.content,
      role: message.role as 'user' | 'assistant' | 'system',
      createdAt: new Date()
    };
    
    // Add the message to the state
    setMessages(prev => [...prev, newMessage]);
    
    // If it's a user message, generate a response
    if (message.role === 'user') {
      await sendMessage(message.content);
    }
    
    return newMessage.id;
  };
  
  // Function to remove a participant from the chat
  const removeParticipant = (participantId: string) => {
    // Don't remove the main AI assistant
    if (participantId === 'ai-assistant') {
      toast.error("Cannot remove the main assistant from the chat");
      return;
    }
    
    // Find the participant to remove
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    
    // Remove the participant
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    
    // Add system message
    const systemMessage: Message = {
      id: generateUUID(),
      content: `${participant.name} has left the chat.`,
      role: 'system',
      createdAt: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
    
    toast.success(`Removed ${participant.name} from the chat`);
  };
  
  // Filter personas based on search query
  const filteredPersonas = MOCK_PERSONAS.filter(persona => 
    persona.character.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (persona.description && persona.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Filter chat history based on search query
  const filteredHistory = MOCK_CHAT_HISTORY.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate XP progress percentage
  const xpProgressPercentage = (xpLevel.progress / xpLevel.max) * 100;

  return (
    <div className="chat-layout">
      {/* Left Sidebar - Chat History */}
      <div className={`sidebar history-sidebar ${historyCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Chat History</h2>
          <button 
            className="sidebar-toggle" 
            onClick={() => setHistoryCollapsed(!historyCollapsed)}
            aria-label={historyCollapsed ? "Expand history" : "Collapse history"}
          >
            {historyCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
        />
      </div>
        
        <div className="chat-history-list">
          {filteredHistory.map(chat => (
            <div key={chat.id} className="chat-history-item">
              <div className="chat-history-title">{chat.title}</div>
              <div className="chat-history-date">{chat.date}</div>
              <div className="chat-history-preview">{chat.preview}</div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <button className="new-chat-button">
            <span className="icon">+</span> New Chat
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-info">
            <h1 className="chat-title">
              {participants[0]?.name || 'AI Assistant'}
            </h1>
            <div className="chat-subtitle">
              {participants.length > 1 
                ? `${participants.length} participants in this chat` 
                : 'Private conversation'}
            </div>
          </div>
          
          <div className="chat-actions">
            <button 
              className="chat-action-button rules-button"
              onClick={toggleChatRules}
              aria-label="Chat Rules"
            >
              <span className="icon">⚙️</span>
              <span className="label">Rules</span>
            </button>
            
            <SimpleTokenDisplay 
              current={tokenUsage.current} 
              limit={tokenUsage.limit} 
              label="Tokens"
            />
            
            <div className="xp-display">
              <div className="xp-rank">{xpLevel.rank}</div>
              <div className="xp-bar-container">
                <div 
                  className="xp-bar-fill" 
                  style={{ width: `${xpProgressPercentage}%` }}
                ></div>
              </div>
              <div className="xp-points">{xpPoints} XP</div>
            </div>
          </div>
        </div>
        
        {/* Chat Rules Modal */}
        {chatRules.isOpen && (
          <div className="chat-rules-modal">
            <div className="chat-rules-header">
              <h3>Chat Rules</h3>
              <button 
                className="close-button"
                onClick={toggleChatRules}
                aria-label="Close rules"
              >
                ×
              </button>
            </div>
            
            <div className="chat-rules-content">
              <div className="rule-group">
                <label>Response Length:</label>
                <div className="rule-options">
                  {['Short', 'Medium', 'Long'].map(option => (
                    <button 
                      key={option}
                      className={`rule-option ${chatRules.responseLength === option ? 'selected' : ''}`}
                      onClick={() => useChatRules.setState({ responseLength: option as any })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="rule-group">
                <label>Tone:</label>
                <div className="rule-options">
                  {['Casual', 'Formal', 'Technical'].map(option => (
                    <button 
                      key={option}
                      className={`rule-option ${chatRules.tone === option ? 'selected' : ''}`}
                      onClick={() => useChatRules.setState({ tone: option as any })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="rule-group">
                <label>Creativity: {chatRules.creativity}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={chatRules.creativity}
                  onChange={(e) => useChatRules.setState({ creativity: parseInt(e.target.value) })}
                  className="creativity-slider"
                />
              </div>
            </div>
            
            <div className="chat-rules-footer">
              <button 
                className="apply-button"
                onClick={toggleChatRules}
              >
                Apply Rules
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="messages-container">
          <div className="messages-scroll-area">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.role}`}
              >
                {message.role === 'system' ? (
                  <div className="system-message">
                    {message.content}
                  </div>
                ) : (
                  <>
                    <div className="message-avatar">
                      {message.role === 'user' ? (
                        <div className="user-avatar">U</div>
                      ) : (
                        <div className="ai-avatar">
                          {participants[0]?.avatarUrl ? (
                            <img 
                              src={participants[0].avatarUrl} 
                              alt={participants[0].name} 
                              className="avatar-image"
                            />
                          ) : (
                            participants[0]?.name?.charAt(0) || 'A'
                          )}
                        </div>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {message.role === 'user' ? 'You' : participants[0]?.name || 'AI Assistant'}
                        </span>
                        <span className="message-time">
                          {message.createdAt ? message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="message-text">{message.content}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant loading">
                <div className="message-avatar">
                  <div className="ai-avatar">
                    {participants[0]?.avatarUrl ? (
                      <img 
                        src={participants[0].avatarUrl} 
                        alt={participants[0].name} 
                        className="avatar-image"
                      />
                    ) : (
                      participants[0]?.name?.charAt(0) || 'A'
                    )}
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">
                      {participants[0]?.name || 'AI Assistant'}
                    </span>
                    <span className="message-time">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Drop zone for personas */}
            <div 
              ref={dropTargetRef}
              className="persona-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="drop-zone-content">
                <span className="drop-icon">⤓</span>
                <span className="drop-text">Drop persona here to add to chat</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Input */}
        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="chat-form">
            <div className="participants-chips">
              {participants.map(participant => (
                <div key={participant.id} className="participant-chip">
                  {participant.avatarUrl ? (
                    <img 
                      src={participant.avatarUrl} 
                      alt={participant.name} 
                      className="chip-avatar"
                    />
                  ) : (
                    <span className="chip-avatar-text">
                      {participant.name.charAt(0)}
                    </span>
                  )}
                  <span className="chip-name">{participant.name}</span>
                  {participant.id !== 'ai-assistant' && (
                    <button 
                      type="button"
                      className="chip-remove"
                      onClick={() => removeParticipant(participant.id)}
                      aria-label={`Remove ${participant.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="input-row">
              <textarea
                className="chat-input"
                placeholder={`Message ${participants[0]?.name || 'AI Assistant'}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isLoading || isReadonly}
                rows={1}
                autoFocus
              />
              
              <div className="input-actions">
                {isLoading ? (
                  <button 
                    type="button" 
                    className="stop-button"
                    onClick={stop}
                  >
                    Stop
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="send-button"
                    disabled={!input.trim() || isReadonly}
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right Sidebar - Personas */}
      <div className={`sidebar personas-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Personas</h2>
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand personas" : "Collapse personas"}
          >
            {sidebarCollapsed ? '←' : '→'}
          </button>
        </div>
        
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="personas-list">
          {filteredPersonas.map(persona => (
            <div 
              key={persona.id}
              className="persona-card"
              draggable
              onDragStart={(e) => handleDragStart(e, persona)}
              onDragEnd={handleDragEnd}
            >
              <div className="persona-avatar">
                {persona.avatarUrl ? (
                  <img 
                    src={persona.avatarUrl} 
                    alt={persona.character} 
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {persona.character.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="persona-info">
                <div className="persona-name">{persona.character}</div>
                <div className="persona-role">{persona.role}</div>
                <div className="persona-response-time">
                  <span className="response-label">Response:</span>
                  <span className={`response-value ${persona.responseTime.toLowerCase()}`}>
                    {persona.responseTime}
                  </span>
                </div>
              </div>
              
              <div className="persona-actions">
                <button 
                  className="add-persona-button"
                  onClick={() => {
                    // Simulate drop event
                    if (!participants.some(p => p.id === persona.id)) {
                      setParticipants(prev => [...prev, {
                        id: persona.id,
                        name: persona.character,
                        role: persona.role,
                        avatarUrl: persona.avatarUrl
                      }]);
                      
                      toast.success(`Added ${persona.character} to the chat`);
                      
                      const systemMessage: Message = {
                        id: generateUUID(),
                        content: `${persona.character} has joined the chat.`,
                        role: 'system',
                        createdAt: new Date()
                      };
                      setMessages(prev => [...prev, systemMessage]);
                    } else {
                      toast.info(`${persona.character} is already in the chat`);
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <button className="create-persona-button">
            <span className="icon">+</span> Create Persona
          </button>
        </div>
      </div>
    </div>
  );
}
