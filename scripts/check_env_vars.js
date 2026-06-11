const fs = require('fs');
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
lines.forEach((l, idx) => {
  if (l.startsWith('DATABASE_URL')) {
    const parts = l.split('=');
    const value = parts[1] ? parts[1].trim() : '';
    console.log(`Line ${idx + 1}: key=${parts[0]}, valueLength=${value.length}`);
  }
});
