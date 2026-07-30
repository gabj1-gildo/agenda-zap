const fs = require('fs');

let code = fs.readFileSync('front-end/src/components/PaymentConfig.tsx', 'utf-8');

// replace export function PaymentConfig({ tenantId }: { tenantId: string })
code = code.replace(
  /export function PaymentConfig\(\{ tenantId \}: \{ tenantId: string \}\) \{/,
  'export function PaymentConfig({ tenantId, token }: { tenantId: string; token?: string }) {'
);

// replace headers: { 'tenant-id': tenantId } in GET
code = code.replace(
  /headers: \{ 'tenant-id': tenantId \}/g,
  "headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }"
);

// replace headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId } in PATCH
code = code.replace(
  /headers: \{\s*'Content-Type': 'application\/json',\s*'tenant-id': tenantId\s*\}/g,
  "headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }"
);

fs.writeFileSync('front-end/src/components/PaymentConfig.tsx', code);

// Now patch app/settings/page.tsx to pass token to PaymentConfig
let page = fs.readFileSync('front-end/src/app/settings/page.tsx', 'utf-8');
page = page.replace(
  /<PaymentConfig tenantId=\{targetTenantId as string\} \/>/g,
  "<PaymentConfig tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />"
);
// just in case it's without "as string"
page = page.replace(
  /<PaymentConfig tenantId=\{targetTenantId\} \/>/g,
  "<PaymentConfig tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />"
);

fs.writeFileSync('front-end/src/app/settings/page.tsx', page);
console.log('PaymentConfig patched');
