const fs = require('fs');

let page = fs.readFileSync('front-end/src/app/settings/page.tsx', 'utf-8');
page = page.split('\\`').join('`');
fs.writeFileSync('front-end/src/app/settings/page.tsx', page);

let serv = fs.readFileSync('front-end/src/components/ServicesSettings.tsx', 'utf-8');
serv = serv.split('\\`').join('`');
fs.writeFileSync('front-end/src/components/ServicesSettings.tsx', serv);

console.log('Fixed backticks');
