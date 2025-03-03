import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signIn } from '@/app/(auth)/auth';

export default function LoginPage() {
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-gray-500">Enter your credentials to continue</p>
        </div>
        <Suspense>
          <AuthForm isPending={isPending} onSubmit={onSubmit} />
        </Suspense>
        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium underline">
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
}
