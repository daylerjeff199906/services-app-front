import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/pages/EditServicePage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// List of custom tags/components to ignore or treat as self-closing
// Since React components are capitalized, we can ignore any capitalized tags
// unless they are specific layout containers we care about.
function shouldIgnore(tagName) {
  // Ignore capitalized tags (custom React components) except FormFooter
  if (tagName[0] === tagName[0].toUpperCase() && tagName !== 'FormFooter') {
    return true;
  }
  return false;
}

const tagRegex = /<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>/gs;

let match;
const tags = [];

function getLineNumber(index) {
  return content.substring(0, index).split('\n').length;
}

while ((match = tagRegex.exec(content)) !== null) {
  const fullTag = match[0];
  const isClosing = !!match[1];
  const tagName = match[2];
  const isSelfClosing = !!match[4] || fullTag.endsWith('/>');
  const index = match.index;
  const line = getLineNumber(index);

  if (shouldIgnore(tagName)) {
    continue;
  }

  if (isSelfClosing) {
    continue;
  }

  if (isClosing) {
    if (tags.length === 0) {
      console.log(`Unmatched closing tag: </${tagName}> on line ${line}`);
    } else {
      const last = tags.pop();
      if (last.name !== tagName) {
        console.log(`Mismatch: opened <${last.name}> (line ${last.line}) but closed </${tagName}> (line ${line})`);
      }
    }
  } else {
    tags.push({ name: tagName, line });
  }
}

console.log('Open tags left:', tags);
