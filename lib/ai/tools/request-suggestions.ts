import { z } from 'zod';
import { ChatMessage } from '@/lib/types';

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
      if (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
      // Skip other roles that might cause type issues
    });

    // Use direct OpenAI API instead of SDK to avoid type compatibility issues
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined');
    }

    // Create a fetch request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
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
