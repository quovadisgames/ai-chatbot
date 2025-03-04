const fs = require('fs');
const path = require('path');

// Create the file path
const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

// Create the file content with the correct closing tag
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

// Write the file
try {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('File created successfully with the correct closing tag!');
  
  // Verify the content
  const writtenContent = fs.readFileSync(filePath, 'utf8');
  if (writtenContent.includes('</output>')) {
    console.log('Verification successful: File contains the correct closing tag!');
  } else {
    console.log('Verification failed: File does not contain the correct closing tag!');
  }
} catch (error) {
  console.error('Error writing to file:', error);
} 