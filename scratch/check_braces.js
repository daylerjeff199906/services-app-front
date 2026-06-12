import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/pages/EditServicePage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const stack = [];
const lines = content.split('\n');

// We want to scan the file and keep a stack of brackets
// To ignore comments and strings, we do a simple character scanner
let inString = null; // ' or " or `
let inComment = false; // // or /*
let inRegex = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1];
  const prevChar = content[i - 1];
  
  const line = content.substring(0, i).split('\n').length;
  
  if (inComment) {
    if (inComment === 'line' && char === '\n') {
      inComment = false;
    } else if (inComment === 'block' && char === '*' && nextChar === '/') {
      inComment = false;
      i++;
    }
    continue;
  }
  
  if (inString) {
    if (char === '\\') {
      i++; // skip escaped char
    } else if (char === inString) {
      inString = false;
    }
    continue;
  }
  
  // check for comments
  if (char === '/' && nextChar === '/') {
    inComment = 'line';
    i++;
    continue;
  }
  if (char === '/' && nextChar === '*') {
    inComment = 'block';
    i++;
    continue;
  }
  
  // check for string literals
  if (char === "'" || char === '"' || char === '`') {
    inString = char;
    continue;
  }
  
  // check for braces/parentheses
  if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, line, index: i });
  } else if (char === '}' || char === ')' || char === ']') {
    if (stack.length === 0) {
      console.log(`Extra closing bracket: '${char}' on line ${line}`);
    } else {
      const top = stack.pop();
      const match = (top.char === '{' && char === '}') ||
                    (top.char === '(' && char === ')') ||
                    (top.char === '[' && char === ']');
      if (!match) {
        console.log(`Mismatch: opened '${top.char}' (line ${top.line}) but closed '${char}' (line ${line})`);
      }
    }
  }
}

console.log('Brackets left in stack:', stack.length);
if (stack.length > 0) {
  console.log('First few unclosed brackets:');
  console.log(stack.slice(0, 10));
}
