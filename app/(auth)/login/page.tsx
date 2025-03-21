'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AuthForm } from '@/components/auth-form';

// Import the Exo 2 font
import { Exo_2 } from 'next/font/google';

// Import the KOTOR theme styles
import '@/styles/kotor-theme.css';

// Initialize the font
const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-exo2',
});

// Custom submit button with sci-fi styling
function CustomSubmitButton({
  children,
  isLoading,
  isSuccessful,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  isSuccessful: boolean;
}) {
  return (
    <button
      className={`holographic-button w-full relative overflow-hidden ${
        isSuccessful ? 'bg-green-500' : ''
      }`}
      disabled={isLoading}
    >
      <span className="response-number">→</span>
      {children}
    </button>
  );
}

// Component that uses useSearchParams
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!result?.ok) {
        setError('Invalid credentials');
        return;
      }

      setIsSuccessful(true);
      window.location.href = callbackUrl;
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      action={handleSubmit}
      error={error}
      submitButton={
        <CustomSubmitButton
          isLoading={isLoading}
          isSuccessful={isSuccessful}
        >
          {isLoading ? 'Authenticating...' : 'Login'}
        </CustomSubmitButton>
      }
    >
      <div className="flex justify-end">
        <Link
          href="/register"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Don't have an account? Register
        </Link>
      </div>
    </AuthForm>
  );
}

export default function Page() {
  return (
    <div className={`${exo2.variable} kotor-theme`}>
      <div className="terminal-background flex h-dvh w-screen items-center justify-center">
        <div className="holoscreen-container w-full max-w-md overflow-hidden rounded-lg flex flex-col gap-8">
          <div className="terminal-header py-4 px-6 text-center">
            <h3 className="text-xl font-semibold text-white text-glow">SECURE ACCESS TERMINAL</h3>
            <div className="scanline"></div>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold text-white text-glow">Authentication Required</h3>
            <p className="text-sm text-blue-300">
              Enter your credentials to access the system
            </p>
          </div>
          
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
          
          <div className="terminal-footer py-2 px-4 text-xs text-blue-400 flex justify-between">
            <div className="flex items-center">
              <div className="status-dot"></div>
              <span>Secure Connection</span>
            </div>
            <div>Encryption: ACTIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
