const fs = require('fs');

const files = [
  'front-end/src/app/page.tsx',
  'front-end/src/app/billing/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.split('\\`').join('`');
  fs.writeFileSync(f, content);
  console.log('Fixed ' + f);
});
