const fs = require('fs');
const path = require('path');

// The correct content with proper closing tag
const content = `'use client';

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
        {pending || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}`;

// Write the content to the file
try {
  fs.writeFileSync(path.join(__dirname, 'components', 'submit-button.tsx'), content, 'utf8');
  console.log('File successfully updated with correct closing tag!');
} catch (error) {
  console.error('Error writing to file:', error);
} 