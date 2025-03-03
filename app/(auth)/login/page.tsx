import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-gray-500">Enter your credentials to continue</p>
        </div>
        <Suspense>
          <LoginForm />
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
