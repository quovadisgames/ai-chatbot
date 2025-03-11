import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResponseTime = 'Fast' | 'Medium' | 'Slow';

export interface Persona {
  character: string;
  role: string;
  responseTime: ResponseTime;
  description?: string;
  avatarUrl?: string;
}

interface PersonaState {
  persona: Persona | null;
  setPersona: (persona: Persona) => void;
  clearPersona: () => void;
}

export const usePersona = create<PersonaState>()(
  persist(
    (set) => ({
      persona: null,
      setPersona: (persona: Persona) => set({ persona }),
      clearPersona: () => set({ persona: null }),
    }),
    {
      name: 'pdt-ai-persona',
    }
  )
); 