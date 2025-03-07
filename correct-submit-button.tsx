'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';

export function SubmitButton({
  children,
  isPending = false,
}: {
  children: React.ReactNode;
  isPending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="px-1 py-0.5 text-red-500 hover:bg-gray-100 rounded disabled:opacity-50 flex items-center gap-2"
    >
      {isPending && <LoaderIcon className="animate-spin" />}
      {children}
    </button>
  );
} 
