console.log('Test server starting...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Files in directory:', require('fs').readdirSync('.'));
console.log('Checking node_modules...');
try {
  const fs = require('fs');
  if (fs.existsSync('./node_modules')) {
    console.log('node_modules exists');
    console.log('node_modules contents:', fs.readdirSync('./node_modules').slice(0, 10));
  } else {
    console.log('node_modules does not exist');
  }
} catch (error) {
  console.log('Error checking node_modules:', error.message);
}
console.log('Test server running on port 3001');

// Keep the server running
setInterval(() => {
  console.log('Server still running...');
}, 10000);
