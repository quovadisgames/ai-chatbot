'use client';

import Link from 'next/link';
import { useState } from 'react';
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

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email');
  const email = emailParam || undefined; // Convert null to undefined

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setIsSuccessful(false);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.get('email'),
        password: formData.get('password'),
        callbackUrl: '/',
      });

      if (!res?.error) {
        setIsSuccessful(true);
        window.location.href = '/';
      } else {
        console.error('Login failed:', res.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <CustomSubmitButton isSuccessful={isSuccessful} isLoading={isLoading}>
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </CustomSubmitButton>
            <p className="text-center text-sm text-blue-300 mt-4">
              {"No access credentials? "}
              <Link
                href="/register"
                className="font-semibold text-blue-400 hover:text-blue-300 text-glow-sm hover:underline transition-colors"
              >
                Request Authorization
              </Link>
              {' now.'}
            </p>
          </AuthForm>
          
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
