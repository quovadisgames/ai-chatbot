const fs = require('fs');
const path = require('path');

// Paths to files
const groupPagePath = path.join(__dirname, '..', 'app', '(chat)', 'page.tsx');
const groupPageBackupPath = path.join(__dirname, '..', 'app', '(chat)', 'client-page-backup.tsx');

// Confirm before overwriting
function confirmRestore() {
  console.log('\n⚠️  WARNING: This will restore client components and may break the build if there are still issues.');
  console.log('Only run this after a successful deployment with the simplified components.\n');
  console.log('Press Y to continue, any other key to abort.');
  
  // This is a synchronous way to get user input in Node.js
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Continue? [Y/n] ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Restore a file from backup
function restoreFile(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Backup file ${sourcePath} does not exist!`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(sourcePath, { encoding: 'utf8' });
    fs.writeFileSync(targetPath, content, { encoding: 'utf8' });
    console.log(`✅ Successfully restored ${targetPath} from backup`);
    return true;
  } catch (err) {
    console.error(`❌ Error restoring ${targetPath}:`, err);
    return false;
  }
}

// Execute the restore process
async function restoreClientComponents() {
  console.log('🔄 Starting gradual restoration of client components...');
  
  const confirmed = await confirmRestore();
  if (!confirmed) {
    console.log('❌ Restore aborted by user');
    process.exit(0);
  }
  
  // Stage 1: Restore the group page
  console.log('\n--- Stage 1: Restoring (chat)/page.tsx ---');
  const groupPageRestored = restoreFile(groupPageBackupPath, groupPagePath);
  
  if (groupPageRestored) {
    console.log('\n✅ Stage 1 completed successfully!');
    console.log('Deploy and test before proceeding to restore more components.');
  } else {
    console.log('\n❌ Stage 1 failed. Check the errors above.');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Commit these changes');
  console.log('2. Deploy and verify the build succeeds');
  console.log('3. If successful, continue with restoring other components');
}

// Run the restore process
restoreClientComponents(); 