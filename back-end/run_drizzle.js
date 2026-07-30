const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'generate'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  if (output.includes('rename')) {
    // If it asks "Are you renaming?" we can answer 'n' or 'y' or just press enter
    child.stdin.write('\n');
  } else if (output.includes('Yes, I am sure')) {
     child.stdin.write('\n');
  } else if (output.includes('Are you sure you want to drop')) {
     child.stdin.write('\n');
  } else if (output.includes('?')) {
     child.stdin.write('\n');
  }
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
