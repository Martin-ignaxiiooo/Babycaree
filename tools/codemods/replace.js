const fs = require('fs');
const path = require('path');

function replaceInDir(dir, search, replace) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      replaceInDir(filePath, search, replace);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(search)) {
        fs.writeFileSync(filePath, content.replaceAll(search, replace), 'utf8');
        console.log(`Replaced in ${filePath}`);
      }
    }
  }
}

replaceInDir(
  path.join(__dirname, 'apps/web/src'), 
  'http://localhost:3000', 
  'https://babycare-backend-msyq.onrender.com'
);
