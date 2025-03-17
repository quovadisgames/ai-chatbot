import OpenAI from 'openai';
import { createDocumentHandler } from '@/lib/artifacts/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    // Use direct OpenAI API call
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: title,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data[0]?.url;
    
    if (imageUrl) {
      dataStream.writeData({
        type: 'image-url',
        url: imageUrl,
      });
    }

    return imageUrl || '';
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    // Use direct OpenAI API call
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: description,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data[0]?.url;
    
    if (imageUrl) {
      dataStream.writeData({
        type: 'image-url',
        url: imageUrl,
      });
    }

    return imageUrl || '';
  },
});
