const { spawn } = require('child_process');
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['drizzle-kit', 'generate'], { stdio: ['pipe', 'pipe', 'pipe'], shell: true });

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  if (str.includes('created or renamed') || str.includes('?')) {
    child.stdin.write('\r\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  process.exit(code);
});
