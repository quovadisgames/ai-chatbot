import { trackTokenUsage } from '@/lib/ai/token-tracking';
import { auth } from '@/auth';
import { saveTokenUsage } from './db/queries';

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

  // Use direct OpenAI API instead of AI SDK to avoid type compatibility issues
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
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  // Create a properly formatted SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = response.body?.getReader();
      
      if (!reader) {
        controller.close();
        return;
      }
      
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));
                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${content}\n\n`));
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing OpenAI stream:', error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
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