const fs = require('fs');
const path = require('path');

// Create the file path
const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

// Create the file content with the correct closing tag
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

// Create the closing tag separately
const closingTag = "      <" + "/" + "output" + ">";

const part2 = `
    </Button>
  );
}`;

// Combine all parts
const content = part1 + '\n' + closingTag + part2;

// Write the file
try {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('File created successfully with the correct closing tag!');
} catch (error) {
  console.error('Error writing to file:', error);
} 