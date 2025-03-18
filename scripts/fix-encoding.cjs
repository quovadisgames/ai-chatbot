const fs = require('fs');
const path = require('path');

// Paths to files with potential encoding issues
const chatPagePath = path.join(__dirname, '..', 'app', '(chat)', 'chat', 'page.tsx');
const groupPagePath = path.join(__dirname, '..', 'app', '(chat)', 'page.tsx');
const placeholderFile = path.join(__dirname, '..', 'app', '(chat)', 'chat', 'placeholder.js');

// Function to fix a file with proper UTF-8 encoding
function fixFileEncoding(filePath, content) {
  // Delete the file if it exists
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted existing ${filePath}`);
    } catch (err) {
      console.error(`Error deleting ${filePath}:`, err);
    }
  }
  
  // Write the new file with explicit UTF-8 encoding
  try {
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log(`Successfully created ${filePath} with UTF-8 encoding`);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Content for the files
const chatPageContent = `export default function ChatPage() {
  return <div>Chat Page</div>;
}`;

const groupPageContent = `export default function RootPage() {
  return <div>Chat Home Page</div>;
}`;

try {
  // Fix the chat page
  fixFileEncoding(chatPagePath, chatPageContent);
  
  // Fix the route group page
  fixFileEncoding(groupPagePath, groupPageContent);
  
  console.log('All files fixed successfully');
} catch (error) {
  console.error(`Error fixing encoding:`, error);
  process.exit(1);
} 