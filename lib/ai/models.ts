// Define model constants without using AI SDK to avoid type compatibility issues
export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'deepseek-r1',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];
