const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'submit-button.tsx');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Use a regular expression to find and replace the incorrect closing tag
  const regex = /<\/o>/g;
  const fixedContent = data.replace(regex, '</output>');

  // Write the fixed content back to the file
  fs.writeFile(filePath, fixedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File updated successfully with the correct closing tag.');
  });
}); 