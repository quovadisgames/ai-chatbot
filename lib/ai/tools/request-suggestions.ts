import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Instead of trying to define a complex type, we'll convert the messages to the expected format
export async function getRequestSuggestions(
  messages: Array<{ role: string; content: string }>
) {
  try {
    // Create a properly formatted array of messages for the OpenAI API
    const formattedMessages = [
      {
        role: 'system' as const,
        content: `You are a helpful assistant that suggests follow-up questions or requests based on the conversation history.
        Analyze the conversation and suggest 3 follow-up questions or requests that would be helpful for the user.
        Return a JSON array of strings with your suggestions.
        Make the suggestions diverse and interesting.`
      }
    ];
    
    // Add each message with proper type casting based on role
    messages.forEach(msg => {
      if (msg.role === 'system') {
        formattedMessages.push({
          role: 'system' as const,
          content: msg.content
        });
      } else if (msg.role === 'user') {
        formattedMessages.push({
          role: 'user' as const,
          content: msg.content
        });
      } else if (msg.role === 'assistant') {
        formattedMessages.push({
          role: 'assistant' as const,
          content: msg.content
        });
      } else if (msg.role === 'function') {
        // Skip function messages as they require a name property
        // or handle them properly if needed
      } else if (msg.role === 'tool') {
        // Skip tool messages as they require additional properties
        // or handle them properly if needed
      }
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
