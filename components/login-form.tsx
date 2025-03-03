'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn } from '@/app/(auth)/auth';
import { AuthForm } from '@/components/auth-form';

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    try {
      setIsPending(true);
      const result = await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid credentials');
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

  return <AuthForm isPending={isPending} onSubmit={onSubmit} />;
} 