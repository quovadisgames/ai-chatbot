const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the incorrect closing tag
  content = content.replace('</o>', '</output>');
  
  // Write the corrected content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('File successfully updated with correct closing tag!');
} catch (error) {
  console.error('Error processing file:', error);
}