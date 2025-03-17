import { z } from 'zod';
import OpenAI from 'openai';
import { ChatMessage } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Instead of trying to define a complex type, we'll convert the messages to the expected format
export async function getRequestSuggestions(
  messages: Array<ChatMessage>
) {
  try {
    // Create a properly formatted array of messages for the OpenAI API
    const formattedMessages = [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests follow-up questions or requests based on the conversation history.
        Analyze the conversation and suggest 3 follow-up questions or requests that would be helpful for the user.
        Return a JSON array of strings with your suggestions.
        Make the suggestions diverse and interesting.`
      }
    ];
    
    // Add each message with proper type casting based on role
    messages.forEach((msg: ChatMessage) => {
      if (msg.role === 'system') {
        formattedMessages.push({
          role: 'system',
          content: msg.content
        });
      } else if (msg.role === 'user') {
        formattedMessages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.role === 'assistant') {
        formattedMessages.push({
          role: 'assistant',
          content: msg.content
        });
      }
      // Skip function and tool messages as they require additional properties
      // Ignore other roles
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    try {
      const parsed = JSON.parse(content);
      return parsed.suggestions || [];
    } catch (e) {
      console.error('Failed to parse suggestions:', e);
      return [];
    }
  } catch (error) {
    console.error('Error getting request suggestions:', error);
    return [];
  }
}
