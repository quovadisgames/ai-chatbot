import OpenAI from 'openai';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Write about the given topic. Markdown is supported. Use headings wherever appropriate.'
        },
        {
          role: 'user',
          content: title
        }
      ],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        draftContent += content;
        dataStream.writeData({
          type: 'text-delta',
          content: content,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';
    const documentContent = document.content && typeof document.content === 'string' 
      ? document.content 
      : '';

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: updateDocumentPrompt(documentContent, 'text')
        },
        {
          role: 'user',
          content: description
        }
      ],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        draftContent += content;
        dataStream.writeData({
          type: 'text-delta',
          content: content,
        });
      }
    }

    return draftContent;
  },
});
