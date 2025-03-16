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
import { useTheme, Theme } from '@/hooks/use-theme';

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

// Theme-specific chat backgrounds
const THEME_BACKGROUNDS: Record<Theme, {
  pattern: string;
  overlay: string;
  accent: string;
}> = {
  kotor: {
    pattern: 'neural-grid',
    overlay: 'rgba(26, 37, 38, 0.95)',
    accent: 'rgba(0, 191, 255, 0.1)'
  },
  swjs: {
    pattern: 'hex-grid',
    overlay: 'rgba(20, 22, 25, 0.95)',
    accent: 'rgba(255, 136, 0, 0.1)'
  },
  professional: {
    pattern: 'dots',
    overlay: 'rgba(255, 255, 255, 0.98)',
    accent: 'rgba(59, 130, 246, 0.1)'
  }
};

// Theme-specific animations
const THEME_ANIMATIONS: Record<Theme, {
  messageIn: string;
  transition: string;
  loading: string;
}> = {
  kotor: {
    messageIn: 'slide-in-bottom',
    transition: 'glow-pulse',
    loading: 'scan-line'
  },
  swjs: {
    messageIn: 'fade-in-right',
    transition: 'saber-flash',
    loading: 'lightsaber-pulse'
  },
  professional: {
    messageIn: 'fade-in',
    transition: 'smooth-fade',
    loading: 'bounce'
  }
};

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

  const { currentTheme } = useTheme();
  
  // Get theme-specific styles
  const themeBackground = THEME_BACKGROUNDS[currentTheme];
  const themeAnimations = THEME_ANIMATIONS[currentTheme];

  return (
    <div className="flex h-[100vh] overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`
          relative
          ${sidebarCollapsed ? 'w-0' : 'w-64'}
          transition-all duration-300
          border-r border-border
          ${currentTheme}-theme
        `}
      >
        {/* Sidebar content */}
        <div className="h-full p-4 space-y-4">
          {/* Chat history */}
          <div className={`space-y-2 ${historyCollapsed ? 'hidden' : ''}`}>
            <h2 className="text-lg font-semibold">Mission Log</h2>
            {filteredHistory.map(chat => (
              <Link 
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={`
                  block p-2 rounded-lg
                  hover:bg-accent/10
                  transition-colors
                  ${chat.id === chatId ? 'bg-accent/20' : ''}
                `}
              >
                <div className="font-medium">{chat.title}</div>
                <div className="text-sm text-muted-foreground">{chat.preview}</div>
              </Link>
            ))}
          </div>

          {/* Personas */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Squad Members</h2>
            <div 
              ref={dropTargetRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                min-h-[100px]
                rounded-lg
                border-2 border-dashed
                border-accent/30
                p-2
                transition-colors
                ${currentTheme}-theme
              `}
            >
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className={`
                    flex items-center space-x-2 p-2
                    rounded-lg
                    ${currentTheme === 'kotor' ? 'bg-[rgba(0,191,255,0.1)]' :
                      currentTheme === 'swjs' ? 'bg-[rgba(255,136,0,0.1)]' :
                      'bg-accent/10'}
                  `}
                >
                  {participant.avatarUrl && (
                    <img
                      src={participant.avatarUrl}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-sm text-muted-foreground">{participant.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available personas */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Available Allies</h2>
            <div className="space-y-2">
              {filteredPersonas.map(persona => (
                <div
                  key={persona.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, persona)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center space-x-2 p-2
                    rounded-lg cursor-move
                    hover:bg-accent/20
                    transition-colors
                    ${currentTheme}-theme
                  `}
                >
                  {persona.avatarUrl && (
                    <img
                      src={persona.avatarUrl}
                      alt={persona.character}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">{persona.character}</div>
                    <div className="text-sm text-muted-foreground">{persona.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className={`
          p-4 border-b border-border
          ${currentTheme}-theme
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-accent/10"
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
              <h1 className="text-xl font-semibold">
                Chat with {participants[0]?.name}
              </h1>
            </div>
            <SimpleTokenDisplay
              current={tokenUsage.current}
              limit={tokenUsage.limit}
              savings={tokenSavings}
            />
          </div>
        </div>

        {/* Messages */}
        <div 
          className={`
            flex-1 overflow-y-auto p-4 space-y-4
            ${themeBackground.pattern}
            bg-${currentTheme}-theme
          `}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`
                flex items-start space-x-4
                ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}
                animate-${themeAnimations.messageIn}
              `}
            >
              {message.role === 'assistant' && (
                <img
                  src={participants[0]?.avatarUrl}
                  alt={participants[0]?.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`
                  max-w-[70%] p-4 rounded-lg
                  ${message.role === 'assistant' 
                    ? 'bg-accent/10 text-foreground' 
                    : 'bg-primary text-primary-foreground'}
                  ${themeAnimations.transition}
                `}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <img
                  src="/avatars/user.png"
                  alt="You"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          ))}
          {isLoading && (
            <div className={`
              flex items-center justify-center
              animate-${themeAnimations.loading}
            `}>
              <div className="w-8 h-8 rounded-full bg-accent/20" />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className={`
          p-4 border-t border-border
          ${currentTheme}-theme
        `}>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Type your message..."
              className="flex-1 p-2 rounded-lg bg-background border border-border"
              disabled={isLoading || isReadonly}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || isReadonly || !input.trim()}
              className={`
                px-4 py-2 rounded-lg
                bg-primary text-primary-foreground
                hover:bg-primary/90
                disabled:opacity-50
                transition-colors
              `}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
