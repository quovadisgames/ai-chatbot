const fs = require('fs');

// Create the content with the correct closing tag using string concatenation
const part1 = `'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className="relative"
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? 'Loading' : 'Submit form'}`;

const part2 = `      </output>
    </Button>
  );
}`;

// Concatenate the parts to create the full content
const content = part1 + '\n' + part2;

// Write the content to the file
fs.writeFileSync('components/submit-button.tsx', content, 'utf8');
console.log('File created successfully with the correct closing tag.'); 