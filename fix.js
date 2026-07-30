const fs = require('fs');

const f = 'front-end/src/app/(landing)/planos/page.tsx';
let content = fs.readFileSync(f, 'utf8');
content = content.split('\\`').join('`');
fs.writeFileSync(f, content);
console.log('Fixed ' + f);
