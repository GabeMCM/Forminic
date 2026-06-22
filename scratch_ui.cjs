const fs = require('fs');
let code = fs.readFileSync('src/app.js', 'utf8');

// Find all document.querySelector
const queryMatches = [...code.matchAll(/const ([a-zA-Z0-9_]+) = document\.querySelectorAll\(([^)]+)\);/g)];
const elementMatches = [...code.matchAll(/const ([a-zA-Z0-9_]+) = document\.querySelector\(([^)]+)\);/g)];

let tokensJS = 'export const UI_SELECTORS = {\n';
let elementsJS = 'import { UI_SELECTORS } from \'./elements.tokens.js\';\n\nexport const elements = {\n';

let exportNames = [];
elementMatches.forEach(m => {
  if (m[1] === 'element') return; // ignore local loop variables
  const selector = m[2];
  
  tokensJS += '  ' + m[1] + ': ' + selector + ',\n';
  elementsJS += '  ' + m[1] + ': document.querySelector(UI_SELECTORS.' + m[1] + '),\n';
  exportNames.push(m[1]);
});

queryMatches.forEach(m => {
  tokensJS += '  ' + m[1] + ': ' + m[2] + ',\n';
  elementsJS += '  ' + m[1] + ': document.querySelectorAll(UI_SELECTORS.' + m[1] + '),\n';
  exportNames.push(m[1]);
});

tokensJS += '};\n';
elementsJS += '};\n';

fs.mkdirSync('src/ui', { recursive: true });
fs.writeFileSync('src/ui/elements.tokens.js', tokensJS);
fs.writeFileSync('src/ui/elements.js', elementsJS);

// Now remove them from app.js and import them
let newAppJs = code;
elementMatches.forEach(m => {
  if (m[1] === 'element') return;
  newAppJs = newAppJs.replace(m[0] + '\n', '');
});
queryMatches.forEach(m => {
  newAppJs = newAppJs.replace(m[0] + '\n', '');
});

// Create destructured import
const importStatement = 'import { elements } from \'./ui/elements.js\';\nconst { ' + exportNames.join(', ') + ' } = elements;\n\n';

newAppJs = importStatement + newAppJs;
fs.writeFileSync('src/app.js', newAppJs);

console.log('UI elements extracted successfully.');
