'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SimpleTokenDisplay } from '@/components/simple-token-display';
import { usePersona } from '@/hooks/use-persona';
import { useTheme } from '@/hooks/use-theme';

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
  onSave: (persona: any) => void;
  onCancel: () => void;
}

export default function PersonaCreator({ onSave, onCancel }: PersonaCreatorProps) {
  const router = useRouter();
  const { setPersona } = usePersona();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    llm: AVAILABLE_LLMS[0], // Default to GPT-4
    personality: '',
    knowledge: '',
    style: '',
    behavior: '',
    context: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLLMChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLLM = AVAILABLE_LLMS.find(llm => llm.id === e.target.value);
    if (selectedLLM) {
      setFormData(prev => ({
        ...prev,
        llm: selectedLLM
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSave(formData);
    }
  };

  // Get selected role data
  const selectedRole = ROLES.find(role => role.id === formData.role);
  
  // Get selected response time data
  const selectedResponseTime = RESPONSE_TIMES.find(time => time.id === formData.responseTime);
  
  // Calculate total mana cost
  const totalMana = (selectedRole?.mana || 0) + (selectedResponseTime?.mana || 0);
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language Model</label>
              <select
                name="llm"
                value={formData.llm.id}
                onChange={handleLLMChange}
                className="w-full p-2 border rounded"
              >
                {AVAILABLE_LLMS.map(llm => (
                  <option key={llm.id} value={llm.id}>
                    {llm.name} ({llm.provider})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">{formData.llm.description}</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Personality & Knowledge</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Personality Traits</label>
              <textarea
                name="personality"
                value={formData.personality}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Knowledge Base</label>
              <textarea
                name="knowledge"
                value={formData.knowledge}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Behavior & Context</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Communication Style</label>
              <textarea
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Behavioral Rules</label>
              <textarea
                name="behavior"
                value={formData.behavior}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Context & Background</label>
              <textarea
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`bg-${theme}-bg p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStep()}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <div className="space-x-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {step === 3 ? 'Create Persona' : 'Next'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 