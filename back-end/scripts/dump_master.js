const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\jferr\\.gemini\\antigravity-ide\\brain\\60776175-d94e-4cf6-943f-11022d592b88\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = content.split('\n');
const line = lines[153 - 1];
const parsed = JSON.parse(line);
fs.writeFileSync('C:\\Users\\jferr\\Desktop\\agenda_zap\\BACK-END\\temp_master_prompt.txt', parsed.content);
