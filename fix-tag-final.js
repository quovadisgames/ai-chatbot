const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Replace the incorrect closing tag with the correct one
  // Using a different approach with string concatenation
  const search = '<' + '/' + 'o>';
  const replace = '<' + '/' + 'output>';
  const fixedContent = data.replace(search, replace);

  // Write the fixed content back to the file
  fs.writeFile(filePath, fixedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File updated successfully with the correct closing tag.');
  });
}); 