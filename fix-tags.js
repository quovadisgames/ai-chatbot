const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

async function findFiles(dir, extensions = ['.tsx', '.jsx']) {
  const files = await readdir(dir);
  const result = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory() && file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
      result.push(...await findFiles(filePath, extensions));
    } else if (stats.isFile() && extensions.includes(path.extname(file))) {
      result.push(filePath);
    }
  }

  return result;
}

async function fixFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file contains the incorrect closing tag
    if (content.includes('</o>')) {
      console.log(`Fixing file: ${filePath}`);
      const fixedContent = content.replace(/(<\/o>)/g, '</output>');
      await writeFile(filePath, fixedContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

async function main() {
  const rootDir = path.resolve(__dirname);
  const files = await findFiles(rootDir);
  let fixedCount = 0;

  for (const file of files) {
    const fixed = await fixFile(file);
    if (fixed) {
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} files.`);
}

main().catch(console.error); 