'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SimpleTokenDisplay } from '@/components/simple-token-display';
import { usePersona } from '@/hooks/use-persona';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the roles for the AI companion
const ROLES = [
  {
    id: 'engineer',
    name: 'Engineer',
    description: 'Specializes in solving technical problems and building solutions',
    icon: '🛠️',
    mana: 250
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Excels at gathering information and researching topics',
    icon: '🔍',
    mana: 200
  },
  {
    id: 'philosopher',
    name: 'Philosopher',
    description: 'Provides deep insights and thoughtful analysis',
    icon: '🧠',
    mana: 350
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Guides and teaches with patience and wisdom',
    icon: '📚',
    mana: 300
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Generates imaginative ideas and artistic content',
    icon: '🎨',
    mana: 400
  }
];

// Define response time options
const RESPONSE_TIMES = [
  {
    id: 'Fast',
    name: 'Fast',
    description: 'Quick responses with limited depth',
    tokenLimit: 100,
    mana: 50
  },
  {
    id: 'Medium',
    name: 'Medium',
    description: 'Balanced responses with moderate depth',
    tokenLimit: 250,
    mana: 150
  },
  {
    id: 'Slow',
    name: 'Slow',
    description: 'Thorough responses with maximum depth',
    tokenLimit: 500,
    mana: 300
  }
];

interface LLM {
  id: string;
  name: string;
  provider: string;
  model: string;
  description: string;
  maxTokens: number;
  temperature: number;
}

const AVAILABLE_LLMS: LLM[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'gpt-4',
    description: 'Most capable model, best for complex tasks',
    maxTokens: 8192,
    temperature: 0.7
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    description: 'Fast and efficient for most tasks',
    maxTokens: 4096,
    temperature: 0.7
  },
  {
    id: 'claude-2',
    name: 'Claude 2',
    provider: 'Anthropic',
    model: 'claude-2',
    description: 'Advanced reasoning and analysis',
    maxTokens: 100000,
    temperature: 0.7
  },
  {
    id: 'claude-instant',
    name: 'Claude Instant',
    provider: 'Anthropic',
    model: 'claude-instant',
    description: 'Fast responses for simple tasks',
    maxTokens: 100000,
    temperature: 0.7
  }
];

interface PersonaCreatorProps {
  onSubmit: (persona: {
    name: string;
    description: string;
    model: string;
    visibility: 'public' | 'private';
  }) => void;
}

export function PersonaCreator({ onSubmit }: PersonaCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, model, visibility });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Persona Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Textarea
          placeholder="Persona Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={visibility} onValueChange={(value: 'public' | 'private') => setVisibility(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Create Persona</Button>
    </form>
  );
} 