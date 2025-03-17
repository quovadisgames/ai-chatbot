import { z } from 'zod';
import OpenAI from 'openai';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: codePrompt
        },
        {
          role: 'user',
          content: title
        }
      ],
      stream: true,
      response_format: { type: 'json_object' }
    });

    let jsonContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        jsonContent += content;
        
        try {
          // Try to parse JSON as it comes in
          // This is a simplified approach - in production you'd need to handle partial JSON
          const jsonObj = JSON.parse(jsonContent);
          if (jsonObj.code) {
            dataStream.writeData({
              type: 'code-delta',
              content: jsonObj.code,
            });
            draftContent = jsonObj.code;
          }
        } catch (e) {
          // Ignore parsing errors for partial JSON
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: document.content && typeof document.content === 'string' 
            ? updateDocumentPrompt(document.content, 'code')
            : updateDocumentPrompt('', 'code')
        },
        {
          role: 'user',
          content: description
        }
      ],
      stream: true,
      response_format: { type: 'json_object' }
    });

    let jsonContent = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        jsonContent += content;
        
        try {
          // Try to parse JSON as it comes in
          const jsonObj = JSON.parse(jsonContent);
          if (jsonObj.code) {
            dataStream.writeData({
              type: 'code-delta',
              content: jsonObj.code,
            });
            draftContent = jsonObj.code;
          }
        } catch (e) {
          // Ignore parsing errors for partial JSON
        }
      }
    }

    return draftContent;
  },
});
