const fs = require('fs');
const path = require('path');

// Define the content as an array of strings
const lines = [
  "'use client';",
  "",
  "import { useFormStatus } from 'react-dom';",
  "import { LoaderIcon } from '@/components/icons';",
  "import { Button } from './ui/button';",
  "",
  "export function SubmitButton({",
  "  children,",
  "  isSuccessful,",
  "}: {",
  "  children: React.ReactNode;",
  "  isSuccessful: boolean;",
  "}) {",
  "  const { pending } = useFormStatus();",
  "",
  "  return (",
  "    <Button",
  "      type={pending ? 'button' : 'submit'}",
  "      aria-disabled={pending || isSuccessful}",
  "      disabled={pending || isSuccessful}",
  '      className="relative"',
  "    >",
  "      {children}",
  "",
  "      {(pending || isSuccessful) && (",
  '        <span className="animate-spin absolute right-4">',
  "          <LoaderIcon />",
  "        </span>",
  "      )}",
  "",
  '      <output aria-live="polite" className="sr-only">',
  "        {pending || isSuccessful ? 'Loading' : 'Submit form'}",
  "      </output>",
  "    </Button>",
  "  );",
  "}"
];

// Join the lines with newlines
const content = lines.join('\n');

// Define the file path
const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

// Write the content to the file
try {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('File created successfully with the correct closing tag!');
} catch (error) {
  console.error('Error writing to file:', error);
} 