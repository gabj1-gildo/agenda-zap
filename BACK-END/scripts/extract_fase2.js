const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\jferr\\.gemini\\antigravity-ide\\brain\\60776175-d94e-4cf6-943f-11022d592b88\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = content.split('\n');
const line = lines[153 - 1]; // line 153 is index 152
const parsed = JSON.parse(line);
const match = parsed.content.match(/### Fase 2:[\\s\\S]*?(?=### Fase 3:)/);
console.log(match ? match[0] : 'Nao encontrou Fase 2');
