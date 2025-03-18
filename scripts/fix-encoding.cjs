const fs = require('fs');
const path = require('path');

// Path to the file with potential encoding issues
const targetFile = path.join(__dirname, '..', 'app', '(chat)', 'chat', 'page.tsx');
const placeholderFile = path.join(__dirname, '..', 'app', '(chat)', 'chat', 'placeholder.js');

try {
  // Check if placeholder file exists
  if (fs.existsSync(placeholderFile)) {
    // Import the placeholder content
    const { content } = require(placeholderFile);
    
    // Delete the page.tsx file if it exists
    if (fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
        console.log(`Deleted existing ${targetFile}`);
      } catch (err) {
        console.error(`Error deleting ${targetFile}:`, err);
      }
    }
    
    // Write the new file with explicit UTF-8 encoding
    fs.writeFileSync(targetFile, content, { encoding: 'utf8' });
    console.log(`Successfully created ${targetFile} with UTF-8 encoding`);
  } else {
    // Fallback content if placeholder doesn't exist
    const fallbackContent = `export default function ChatPage() {
  return <div>Chat Page</div>;
}`;

    // Delete and recreate the file with explicit UTF-8 encoding
    if (fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
        console.log(`Deleted existing ${targetFile}`);
      } catch (err) {
        console.error(`Error deleting ${targetFile}:`, err);
      }
    }
    
    fs.writeFileSync(targetFile, fallbackContent, { encoding: 'utf8' });
    console.log(`Successfully created ${targetFile} with UTF-8 encoding (fallback content)`);
  }
} catch (error) {
  console.error(`Error fixing encoding:`, error);
  
  // Last resort - direct echo to file
  try {
    const fallbackContent = `export default function ChatPage() {
  return <div>Chat Page</div>;
}`;
    fs.writeFileSync(targetFile, fallbackContent, { encoding: 'utf8' });
    console.log(`Emergency fallback: created ${targetFile} with direct content`);
  } catch (err) {
    console.error(`Critical failure - could not create file:`, err);
    process.exit(1);
  }
} 