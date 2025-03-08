import { trackTokenUsage } from '@/lib/ai/token-tracking';
import { auth } from '@/auth';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { saveTokenUsage } from './db/queries';
import { Readable } from 'stream';

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
  const USE_MOCK_DB = true; // Match route.ts
  if (USE_MOCK_DB) {
    console.log('[MOCK] Tracking AI usage for prompt:', prompt);
    const mockResponse = `Here's a simple Dijkstra's algorithm in JavaScript:\n\n` +
      "```js\n" +
      "function dijkstra(graph, start) {\n" +
      "  const distances = {};\n" +
      "  const visited = new Set();\n" +
      "  const pq = [[0, start]];\n" +
      "  for (let node in graph) distances[node] = Infinity;\n" +
      "  distances[start] = 0;\n" +
      "  while (pq.length) {\n" +
      "    pq.sort((a, b) => a[0] - b[0]);\n" +
      "    const [dist, u] = pq.shift();\n" +
      "    if (visited.has(u)) continue;\n" +
      "    visited.add(u);\n" +
      "    for (let v in graph[u]) {\n" +
      "      const newDist = dist + graph[u][v];\n" +
      "      if (newDist < distances[v]) {\n" +
      "        distances[v] = newDist;\n" +
      "        pq.push([newDist, v]);\n" +
      "      }\n" +
      "    }\n" +
      "  }\n" +
      "  return distances;\n" +
      "}\n" +
      "```\n" +
      "This finds shortest paths from a start node in a weighted graph.";
    const mockStream = Readable.from([mockResponse]);
    return {
      usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 },
      toDataStream: () => mockStream,
    };
  }
  
  // Existing real OpenAI logic
  const response = await streamText({
    model: openai('gpt-3.5-turbo'),
    prompt,
  });
  const usage = await response.usage;
  
  // Track token usage
  await saveTokenUsage({
    userId,
    model: 'gpt-3.5-turbo',
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  });
  
  return {
    usage: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens
    },
    toDataStream: () => response,
  };
} 