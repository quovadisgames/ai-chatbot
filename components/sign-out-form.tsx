'use client';

import { useState } from 'react';
import { signOut } from '@/app/(auth)/auth';

// Create a server action for sign out
async function handleSignOut() {
  'use server';
  
  await signOut({
    redirectTo: '/',
  });
}

export const SignOutForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleSignOut();
  };
  
  return (
    <form className="w-full" onSubmit={onSubmit}>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-left px-1 py-0.5 text-red-500 hover:bg-gray-100 rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Signing out...' : 'Sign out'}
      </button>
    </form>
  );
};
