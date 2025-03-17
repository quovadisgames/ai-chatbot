import { createStreamableUI, createStreamableValue } from 'ai/rsc';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { saveMessages } from '@/lib/db/queries';
import { type Message } from '@/lib/db/schema';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function POST(req: Request) {
  const { messages, id, model = 'gpt-4', visibility = 'private' } = await req.json();
  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = messages[messages.length - 1];

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    stream: true
  });

  // Create a TransformStream to handle the response
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let content = '';

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      // Forward the chunk to the client
      controller.enqueue(chunk);
      
      // Decode and accumulate the content
      const decoded = decoder.decode(chunk);
      const lines = decoded.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            content += data.choices[0]?.delta?.content || '';
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    },
    async flush(controller) {
      // Save messages when the stream is complete
      try {
        const messagesToSave: Message[] = [
          {
            id: userMessage.id,
            chatId: id,
            content: userMessage.content,
            role: userMessage.role === 'data' ? 'user' : (userMessage.role as 'user' | 'assistant' | 'system'),
            createdAt: new Date()
          },
          {
            id: crypto.randomUUID(),
            chatId: id,
            content,
            role: 'assistant',
            createdAt: new Date()
          }
        ];

        await saveMessages({ messages: messagesToSave });
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
  });

  // Create a ReadableStream from the OpenAI response
  const stream = response.toReadableStream().pipeThrough(transformStream);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'x-chat-id': id,
      'x-chat-visibility': visibility
    }
  });
} 