const fs = require('fs');
const path = require('path');

const duplicateString = `onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                  onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}`;

const correctString = `onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}`;

function cleanInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      cleanInDir(filePath);
    } else if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(duplicateString)) {
        content = content.replaceAll(duplicateString, correctString);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned duplicates in ${filePath}`);
      }
    }
  }
}

cleanInDir(path.join(__dirname, 'apps/web/src'));
