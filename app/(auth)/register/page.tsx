import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { RegisterForm } from '@/components/register-form';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Register</h1>
          <p className="text-gray-500">Create your account to get started</p>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium underline">
            Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
