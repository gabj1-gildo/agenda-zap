const fs = require('fs');

// 1. Patch Sidebar.tsx
let sidebar = fs.readFileSync('front-end/src/components/Sidebar.tsx', 'utf-8');
sidebar = sidebar.replace(
  /fetch\(getBackendUrl\(`\/api\/tenants\/\$\{activeTenantId\}\/badges`\)\)/,
  "fetch(getBackendUrl(`/api/tenants/${activeTenantId}/badges`), { headers: { 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` } })"
);
sidebar = sidebar.replace(
  /signOut\(\{ callbackUrl: `\$\{window\.location\.origin\}\/login` \}\)/g,
  "signOut({ callbackUrl: '/login' })"
);
fs.writeFileSync('front-end/src/components/Sidebar.tsx', sidebar);

// 2. Patch Header.tsx
let header = fs.readFileSync('front-end/src/components/Header.tsx', 'utf-8');
header = header.replace(
  /signOut\(\{ callbackUrl: `\$\{window\.location\.origin\}\/login` \}\)/g,
  "signOut({ callbackUrl: '/login' })"
);
fs.writeFileSync('front-end/src/components/Header.tsx', header);

console.log('Sidebar and Header patched');
