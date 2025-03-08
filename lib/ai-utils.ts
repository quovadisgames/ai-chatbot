import { trackTokenUsage } from '@/lib/ai/token-tracking';
import { auth } from '@/auth';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { saveTokenUsage } from './db/queries';

// Mock user for development
const USE_MOCK_AUTH = true;
const MOCK_USER = {
  id: "mock-user-123",
  email: "dev@example.com"
};

/**
 * Simple function to estimate token count based on text length
 * Approximates tokens as ~4 characters per token
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Track AI usage for a user's prompt
 * @param userId The user ID
 * @param prompt The user's prompt text
 * @returns Object containing the estimated token counts
 */
export async function trackAIUsage(userId: string, prompt: string) {
  const response = await streamText({
    model: openai('gpt-4o'),
    prompt,
  });
  const usage = await response.usage;
  await saveTokenUsage({
    userId,
    model: 'gpt-4o',
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  });
  return response;
} 