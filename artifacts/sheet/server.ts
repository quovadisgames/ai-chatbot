import { z } from 'zod';
import OpenAI from 'openai';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Create a spreadsheet about the given topic. 
          Return a JSON object with a "data" property that is a 2D array representing the spreadsheet.
          The first row should be the headers.
          Make sure the data is well-structured and relevant to the topic.`
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
          const jsonObj = JSON.parse(jsonContent);
          if (jsonObj.data) {
            dataStream.writeData({
              type: 'sheet-delta',
              content: jsonObj.data,
            });
            draftContent = JSON.stringify(jsonObj.data);
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
    let currentData;
    
    try {
      currentData = JSON.parse(document.content);
    } catch (e) {
      currentData = [];
    }

    // Use direct OpenAI API call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: updateDocumentPrompt(JSON.stringify(currentData), 'sheet')
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
          if (jsonObj.data) {
            dataStream.writeData({
              type: 'sheet-delta',
              content: jsonObj.data,
            });
            draftContent = JSON.stringify(jsonObj.data);
          }
        } catch (e) {
          // Ignore parsing errors for partial JSON
        }
      }
    }

    return draftContent;
  },
});
