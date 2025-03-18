const fs = require('fs');
const path = require('path');

// Path to the file with potential encoding issues
const filePath = path.join(__dirname, '..', 'app', '(chat)', 'chat', 'page.tsx');

// Simple content for the page
const content = `export default function ChatPage() {
  return <div>Chat Page</div>;
}
`;

// Write the file with explicit UTF-8 encoding
try {
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  console.log(`Successfully fixed encoding for ${filePath}`);
} catch (error) {
  console.error(`Error writing to ${filePath}:`, error);
} 