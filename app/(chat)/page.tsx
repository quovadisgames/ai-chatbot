'use client';

import { useState, useEffect } from 'react';
import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { PersonaCreator } from '@/components/persona-creator';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { usePersona } from '@/hooks/use-persona';
import type { Persona } from '@/hooks/use-persona';

export default function Page() {
  const chatId = generateUUID();
  const [selectedChatModel, setSelectedChatModel] = useState(DEFAULT_CHAT_MODEL);
  const { persona, setPersona } = usePersona();
  
  // Load chat model from cookie on client side
  useEffect(() => {
    const modelFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('chat-model='))
      ?.split('=')[1];
      
    if (modelFromCookie) {
      setSelectedChatModel(modelFromCookie);
    }
  }, []);

  // Handle persona creation
  const handlePersonaSubmit = (personaData: {
    name: string;
    description: string;
    model: string;
    visibility: 'public' | 'private';
  }) => {
    const newPersona: Persona = {
      character: personaData.name,
      role: 'assistant',
      responseTime: 'Medium',
      description: personaData.description,
    };
    setPersona(newPersona);
  };

  // Show persona creator if no persona is selected
  if (!persona) {
    return <PersonaCreator onSubmit={handlePersonaSubmit} />;
  }

  return (
    <>
      <Chat
        key={chatId}
        chatId={chatId}
        initialMessages={[]}
        selectedChatModel={selectedChatModel}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={chatId} />
    </>
  );
}
