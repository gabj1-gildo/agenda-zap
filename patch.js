const fs = require('fs');
let code = fs.readFileSync('front-end/src/app/settings/page.tsx', 'utf-8');

// replace headers in loadData
code = code.replace(
  /const headers = \{ 'tenant-id': targetTenantId \};/g,
  `const token = (session?.user as any)?.accessToken;
        const headers: any = { 'tenant-id': targetTenantId };
        if (token) headers['Authorization'] = \\\`Bearer \${token}\\\`;`
);

// replace all instances of { 'Content-Type': 'application/json', 'tenant-id': targetTenantId }
code = code.replace(
  /headers: \{ 'Content-Type': 'application\/json', 'tenant-id': targetTenantId \}/g,
  `headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': \\\`Bearer \${(session?.user as any)?.accessToken}\\\` }`
);

// replace headers: { 'tenant-id': targetTenantId } in confirmDeleteKey and handleLogoChange reload
code = code.replace(
  /headers: \{ 'tenant-id': targetTenantId \}/g,
  `headers: { 'tenant-id': targetTenantId, 'Authorization': \\\`Bearer \${(session?.user as any)?.accessToken}\\\` }`
);

// replace in confirmDisconnectWhatsApp
code = code.replace(
  /method: "DELETE"/g,
  `method: "DELETE", headers: { 'Authorization': \\\`Bearer \${(session?.user as any)?.accessToken}\\\` }`
);

// update ServicesSettings call to pass token
code = code.replace(
  /<ServicesSettings tenantId=\{targetTenantId as string\} \/>/g,
  `<ServicesSettings tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />`
);

fs.writeFileSync('front-end/src/app/settings/page.tsx', code);
console.log('updated page.tsx');
