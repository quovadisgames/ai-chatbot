'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';

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

import { register, type RegisterActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, setState] = useState<RegisterActionState>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast.error('Account already exists');
    } else if (state.status === 'failed') {
      toast.error('Failed to create account');
    } else if (state.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state.status === 'success') {
      toast.success('Account created successfully');
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = async (formData: FormData) => {
    setEmail(formData.get('email') as string);
    setIsLoading(true);
    setState({ status: 'in_progress' });
    
    try {
      const result = await register({ status: 'idle' }, formData);
      setState(result);
    } catch (error) {
      setState({ status: 'failed' });
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="terminal-background flex h-dvh w-screen items-center justify-center">
      <div className="holoscreen-container w-full max-w-md overflow-hidden rounded-lg flex flex-col gap-8">
        <div className="terminal-header py-4 px-6 text-center">
          <h3 className="text-xl font-semibold text-white text-glow">NEW USER REGISTRATION</h3>
          <div className="scanline"></div>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold text-white text-glow">Create Access Credentials</h3>
          <p className="text-sm text-blue-300">
            Register your identity in the galactic database
          </p>
        </div>
        
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <CustomSubmitButton isSuccessful={isSuccessful} isLoading={isLoading}>
            {isLoading ? 'Processing...' : 'Register Identity'}
          </CustomSubmitButton>
          <p className="text-center text-sm text-blue-300 mt-4">
            {'Already registered? '}
            <Link
              href="/login"
              className="font-semibold text-blue-400 hover:text-blue-300 text-glow-sm hover:underline transition-colors"
            >
              Access Terminal
            </Link>
            {' now.'}
          </p>
        </AuthForm>
        
        <div className="terminal-footer py-2 px-4 text-xs text-blue-400 flex justify-between">
          <div className="flex items-center">
            <div className="status-dot"></div>
            <span>Secure Registration</span>
          </div>
          <div>Protocol: STANDARD</div>
        </div>
      </div>
    </div>
  );
}
