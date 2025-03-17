import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function getRequestSuggestions(
  messages: Array<{ role: string; content: string }>
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that suggests follow-up questions or requests based on the conversation history.
          Analyze the conversation and suggest 3 follow-up questions or requests that would be helpful for the user.
          Return a JSON array of strings with your suggestions.
          Make the suggestions diverse and interesting.`
        },
        ...messages
      ],
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
