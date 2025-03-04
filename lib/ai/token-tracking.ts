import { db } from '@/lib/db';
import { tokenUsage } from '@/lib/db/schema';
import { auth } from '@/auth';
import { saveTokenUsage } from '@/lib/db/queries';

/**
 * Tracks token usage for a specific API call
 * 
 * @param params Object containing token usage information
 * @returns The created token usage record or null if tracking failed
 */
export async function trackTokenUsage({
  chatId,
  messageId,
  model,
  promptTokens,
  completionTokens,
  totalTokens,
}: {
  chatId?: string;
  messageId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('No user ID found in session for token tracking');
      return null;
    }

    const userId = session.user.id;

    // Use the existing query function to save token usage
    await saveTokenUsage({
      userId,
      chatId,
      messageId,
      model,
      promptTokens,
      completionTokens,
      totalTokens
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to track token usage:', error);
    return null;
  }
}

/**
 * Gets total token usage for a user
 * 
 * @param userId The user ID to get token usage for
 * @returns Object containing token usage statistics
 */
export async function getUserTokenUsage(userId: string) {
  try {
    const result = await db.select({
      totalPromptTokens: db.fn.sum(tokenUsage.promptTokens),
      totalCompletionTokens: db.fn.sum(tokenUsage.completionTokens),
      totalTokens: db.fn.sum(tokenUsage.totalTokens),
    }).from(tokenUsage)
      .where(db.eq(tokenUsage.userId, userId));
    
    // Handle null values from the database
    const data = result[0] || {};
    return {
      totalPromptTokens: Number(data.totalPromptTokens) || 0,
      totalCompletionTokens: Number(data.totalCompletionTokens) || 0,
      totalTokens: Number(data.totalTokens) || 0
    };
  } catch (error) {
    console.error('Failed to get user token usage:', error);
    return { 
      totalPromptTokens: 0, 
      totalCompletionTokens: 0, 
      totalTokens: 0 
    };
  }
}

/**
 * Gets token usage for a specific chat
 * 
 * @param chatId The chat ID to get token usage for
 * @returns Object containing token usage statistics for the chat
 */
export async function getChatTokenUsage(chatId: string) {
  try {
    const result = await db.select({
      totalPromptTokens: db.fn.sum(tokenUsage.promptTokens),
      totalCompletionTokens: db.fn.sum(tokenUsage.completionTokens),
      totalTokens: db.fn.sum(tokenUsage.totalTokens),
    }).from(tokenUsage)
      .where(db.eq(tokenUsage.chatId, chatId));
    
    // Handle null values from the database
    const data = result[0] || {};
    return {
      totalPromptTokens: Number(data.totalPromptTokens) || 0,
      totalCompletionTokens: Number(data.totalCompletionTokens) || 0,
      totalTokens: Number(data.totalTokens) || 0
    };
  } catch (error) {
    console.error('Failed to get chat token usage:', error);
    return { 
      totalPromptTokens: 0, 
      totalCompletionTokens: 0, 
      totalTokens: 0 
    };
  }
} 