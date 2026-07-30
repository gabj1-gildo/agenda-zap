const child_process = require('child_process');

process.stdout.isTTY = true;
process.stdin.isTTY = true;
process.stderr.isTTY = true;

// Emulate a TTY in the parent and require the CLI directly
// But wait, the CLI checks process.stdout.isTTY.
process.argv = [process.argv[0], process.argv[1], 'generate'];
require('drizzle-kit/bin.cjs');
