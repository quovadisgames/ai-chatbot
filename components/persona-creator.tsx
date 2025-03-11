'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SimpleTokenDisplay } from '@/components/simple-token-display';
import { usePersona } from '@/hooks/use-persona';

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

export function PersonaCreator() {
  const router = useRouter();
  const { setPersona } = usePersona();
  const [activeTab, setActiveTab] = useState('name');
  const [formData, setFormData] = useState({
    character: '',
    role: '',
    responseTime: ''
  });
  
  // Handle form input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle tab navigation
  const handleTabChange = (value: string) => {
    // Validate current tab before proceeding
    if (activeTab === 'name' && !formData.character) {
      toast.error('Please name your character before proceeding');
      return;
    }
    
    if (activeTab === 'role' && !formData.role) {
      toast.error('Please select a role for your character');
      return;
    }
    
    setActiveTab(value);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!formData.responseTime) {
      toast.error('Please select a response time');
      return;
    }
    
    // Create the persona
    setPersona({
      character: formData.character,
      role: formData.role,
      responseTime: formData.responseTime as 'Fast' | 'Medium' | 'Slow'
    });
    
    toast.success(`${formData.character} is ready for adventure!`);
    router.push('/');
  };
  
  // Get selected role data
  const selectedRole = ROLES.find(role => role.id === formData.role);
  
  // Get selected response time data
  const selectedResponseTime = RESPONSE_TIMES.find(time => time.id === formData.responseTime);
  
  // Calculate total mana cost
  const totalMana = (selectedRole?.mana || 0) + (selectedResponseTime?.mana || 0);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md bg-card border rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create Your AI Companion</h1>
          <p className="text-muted-foreground">Customize your magical assistant</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="name">Name</TabsTrigger>
            <TabsTrigger value="role">Role</TabsTrigger>
            <TabsTrigger value="speed">Speed</TabsTrigger>
          </TabsList>
          
          {/* Character Name Tab */}
          <TabsContent value="name" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Character Name</label>
              <input
                type="text"
                value={formData.character}
                onChange={(e) => handleChange('character', e.target.value)}
                placeholder="Enter a name for your companion"
                className="w-full p-2 border rounded-md"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Choose a name that reflects your companion's personality
              </p>
            </div>
            
            <button
              onClick={() => handleTabChange('role')}
              disabled={!formData.character}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </button>
          </TabsContent>
          
          {/* Role Selection Tab */}
          <TabsContent value="role" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select a Role</label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
                className="space-y-2"
              >
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer hover:bg-accent ${
                      formData.role === role.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => handleChange('role', role.id)}
                  >
                    <RadioGroupItem value={role.id} id={role.id} className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{role.icon}</span>
                        <label htmlFor={role.id} className="font-medium cursor-pointer">
                          {role.name}
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                      <div className="text-xs text-blue-500">Mana Cost: {role.mana}</div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('name')}
                className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Back
              </button>
              <button
                onClick={() => handleTabChange('speed')}
                disabled={!formData.role}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </TabsContent>
          
          {/* Response Time Tab */}
          <TabsContent value="speed" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Response Speed</label>
              <RadioGroup
                value={formData.responseTime}
                onValueChange={(value) => handleChange('responseTime', value)}
                className="space-y-2"
              >
                {RESPONSE_TIMES.map((time) => (
                  <div
                    key={time.id}
                    className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer hover:bg-accent ${
                      formData.responseTime === time.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => handleChange('responseTime', time.id)}
                  >
                    <RadioGroupItem value={time.id} id={time.id} className="mt-1" />
                    <div className="space-y-1">
                      <label htmlFor={time.id} className="font-medium cursor-pointer">
                        {time.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{time.description}</p>
                      <div className="text-xs">Token Limit: {time.tokenLimit}</div>
                      <div className="text-xs text-blue-500">Mana Cost: {time.mana}</div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('role')}
                className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.responseTime}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Create Companion
              </button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Summary Panel */}
        {(formData.character || formData.role || formData.responseTime) && (
          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h3 className="font-medium mb-2">Character Summary</h3>
            <div className="space-y-2 text-sm">
              {formData.character && (
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{formData.character}</span>
                </div>
              )}
              {formData.role && (
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-medium">
                    {selectedRole?.icon} {selectedRole?.name}
                  </span>
                </div>
              )}
              {formData.responseTime && (
                <div className="flex justify-between">
                  <span>Response Speed:</span>
                  <span className="font-medium">{formData.responseTime}</span>
                </div>
              )}
              {(selectedRole || selectedResponseTime) && (
                <div className="pt-2 border-t">
                  <SimpleTokenDisplay 
                    current={totalMana} 
                    limit={1000} 
                    label="Mana Cost" 
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 