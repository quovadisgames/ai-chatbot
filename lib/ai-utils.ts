import { trackTokenUsage } from '@/lib/ai/token-tracking';
import { auth } from '@/auth';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { saveTokenUsage } from './db/queries';
import { Readable } from 'stream';

interface AIResponse {
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  stream: ReadableStream;
}

// Mock user for development
const USE_MOCK_AUTH = true;
const MOCK_USER = {
  id: "mock-user-123",
  email: "dev@example.com",
};

/**
 * Estimate the number of tokens in a text string
 * This is a very rough estimate, but it's good enough for our purposes
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function trackAIUsage(userId: string, prompt: string): Promise<AIResponse> {
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
    
    // Split into chunks and format as SSE
    const chunks = mockResponse.split('\n').map(line => `data: ${line}\n`);
    chunks.push('\n'); // End event
    
    // Create a ReadableStream with SSE format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach(chunk => {
          controller.enqueue(encoder.encode(chunk));
        });
        controller.close();
      }
    });
    
    return {
      usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 },
      stream,
    };
  }

  // Use the existing AI SDK for real implementation
  const response = await streamText({
    model: openai('gpt-3.5-turbo'),
    prompt,
  });
  
  // Create a properly formatted SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Handle the response as a stream of events
      try {
        // This assumes the AI SDK's response is iterable
        for await (const chunk of response as any) {
          const content = chunk?.content || chunk?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${content}\n\n`));
          }
        }
      } catch (error) {
        console.error('Error processing AI stream:', error);
      }
      
      // End the stream
      controller.enqueue(encoder.encode('\n'));
      controller.close();
    }
  });
  
  // Estimate token usage
  const promptTokens = estimateTokenCount(prompt);
  const completionTokens = 50; // Placeholder
  const totalTokens = promptTokens + completionTokens;
  
  // Track token usage
  await saveTokenUsage({
    userId,
    model: 'gpt-3.5-turbo',
    promptTokens,
    completionTokens,
    totalTokens,
  });
  
  return {
    usage: { promptTokens, completionTokens, totalTokens },
    stream,
  };
} 