'use client';

import { Button } from './ui/button';

// Simple loader icon component
const LoaderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export function CustomSubmitButton({
  children,
  isSuccessful,
  isLoading,
  onClick,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}) {
  const isDisabled = isLoading || isSuccessful;

  return (
    <Button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className="relative"
      onClick={onClick}
    >
      {children}

      {isDisabled && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <span className="sr-only">
        {isDisabled ? 'Loading' : 'Submit form'}
      </span>
    </Button>
  );
} 