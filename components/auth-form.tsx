import { FormEvent } from 'react';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  error = null,
  submitButton = null,
}: {
  action: string | ((formData: FormData) => void | Promise<void>);
  children: React.ReactNode;
  defaultEmail?: string;
  error?: string | null;
  submitButton?: React.ReactNode;
}) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof action === 'function') {
      const formData = new FormData(e.currentTarget);
      action(formData);
    }
  };

  return (
    <form 
      action={typeof action === 'string' ? action : undefined}
      onSubmit={typeof action === 'function' ? handleSubmit : undefined}
      className="flex flex-col gap-4 px-4 sm:px-16"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-blue-300">
          Email
        </Label>
        <Input
          name="email"
          id="email"
          type="email"
          placeholder="name@example.com"
          defaultValue={defaultEmail}
          required
          className="border-blue-400 bg-blue-950/30 text-blue-100 placeholder:text-blue-500"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-blue-300">
          Password
        </Label>
        <Input
          name="password"
          id="password"
          type="password"
          placeholder="••••••••"
          required
          className="border-blue-400 bg-blue-950/30 text-blue-100 placeholder:text-blue-500"
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      {submitButton || (
        <button
          className="mt-4 w-full rounded-md bg-blue-600 py-2 text-white"
          type="submit"
        >
          Submit
        </button>
      )}
      
      {children}
    </form>
  );
}
