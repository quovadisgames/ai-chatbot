const fs = require('fs');

// Create the content with the correct closing tag using string literals
const content = "'use client';\n\n" +
  "import { useFormStatus } from 'react-dom';\n\n" +
  "import { LoaderIcon } from '@/components/icons';\n\n" +
  "import { Button } from './ui/button';\n\n" +
  "export function SubmitButton({\n" +
  "  children,\n" +
  "  isSuccessful,\n" +
  "}: {\n" +
  "  children: React.ReactNode;\n" +
  "  isSuccessful: boolean;\n" +
  "}) {\n" +
  "  const { pending } = useFormStatus();\n\n" +
  "  return (\n" +
  "    <Button\n" +
  "      type={pending ? 'button' : 'submit'}\n" +
  "      aria-disabled={pending || isSuccessful}\n" +
  "      disabled={pending || isSuccessful}\n" +
  "      className=\"relative\"\n" +
  "    >\n" +
  "      {children}\n\n" +
  "      {(pending || isSuccessful) && (\n" +
  "        <span className=\"animate-spin absolute right-4\">\n" +
  "          <LoaderIcon />\n" +
  "        </span>\n" +
  "      )}\n\n" +
  "      <output aria-live=\"polite\" className=\"sr-only\">\n" +
  "        {pending || isSuccessful ? 'Loading' : 'Submit form'}\n" +
  "      </output>\n" +
  "    </Button>\n" +
  "  );\n" +
  "}";

// Write the content to the file
fs.writeFileSync('components/submit-button.tsx', content, 'utf8');
console.log('File created successfully with the correct closing tag.'); 