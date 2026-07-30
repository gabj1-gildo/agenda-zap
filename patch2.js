const fs = require('fs');
let code = fs.readFileSync('front-end/src/components/ServicesSettings.tsx', 'utf-8');

// replace export function ServicesSettings({ tenantId }: { tenantId: string })
code = code.replace(
  /export function ServicesSettings\(\{ tenantId \}: \{ tenantId: string \}\) \{/,
  'export function ServicesSettings({ tenantId, token }: { tenantId: string; token?: string }) {'
);

// replace headers: { 'tenant-id': tenantId } with authorization
code = code.replace(
  /headers: \{ 'tenant-id': tenantId \}/g,
  `headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': \\\`Bearer \${token}\\\` } : {}) }`
);

// replace headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId } with authorization
code = code.replace(
  /headers: \{ 'Content-Type': 'application\/json', 'tenant-id': tenantId \}/g,
  `headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': \\\`Bearer \${token}\\\` } : {}) }`
);

fs.writeFileSync('front-end/src/components/ServicesSettings.tsx', code);
console.log('updated ServicesSettings.tsx');
