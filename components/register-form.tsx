'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn } from '@/app/(auth)/auth';
import { AuthForm } from '@/components/auth-form';

export function RegisterForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    try {
      setIsPending(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        toast.error(error || 'Failed to register');
        return;
      }

      const result = await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Failed to sign in after registration');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  return <AuthForm isPending={isPending} onSubmit={onSubmit} isRegister />;
} 