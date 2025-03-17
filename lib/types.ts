/**
 * Common types used across the application
 */

/**
 * Represents a chat message in the application
 */
export interface ChatMessage {
  /**
   * The role of the message sender
   */
  role: string;
  
  /**
   * The content of the message
   */
  content: string;
  
  /**
   * Optional unique identifier for the message
   */
  id?: string;
  
  /**
   * Allow for additional properties
   */
  [key: string]: any;
}

/**
 * Represents a chat message with a strictly typed role
 */
export interface TypedChatMessage {
  /**
   * The role of the message sender, restricted to valid OpenAI roles
   */
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  
  /**
   * The content of the message
   */
  content: string;
  
  /**
   * Optional unique identifier for the message
   */
  id?: string;
  
  /**
   * Optional name for function or tool messages
   */
  name?: string;
  
  /**
   * Optional tool call ID for tool messages
   */
  tool_call_id?: string;
  
  /**
   * Allow for additional properties
   */
  [key: string]: any;
} 