const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/hr-genie-frontend/src');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Text Colors
  content = content.replace(/\btext-slate-900\b/g, 'text-white');
  content = content.replace(/\btext-gray-900\b/g, 'text-white');
  content = content.replace(/\btext-slate-800\b/g, 'text-slate-100');
  content = content.replace(/\btext-gray-800\b/g, 'text-slate-100');
  content = content.replace(/\btext-slate-700\b/g, 'text-slate-200');
  content = content.replace(/\btext-gray-700\b/g, 'text-slate-200');
  content = content.replace(/\btext-slate-600\b/g, 'text-slate-300');
  content = content.replace(/\btext-gray-600\b/g, 'text-slate-300');
  content = content.replace(/\btext-slate-500\b/g, 'text-slate-400');
  content = content.replace(/\btext-gray-500\b/g, 'text-slate-400');

  // Background Colors (Modals, cards that have bg-white explicitly)
  content = content.replace(/\bbg-white\b/g, 'bg-slate-800');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-slate-900/50');
  content = content.replace(/\bbg-gray-50\b/g, 'bg-slate-900/50');
  content = content.replace(/\bbg-slate-100\b/g, 'bg-slate-800/80');
  content = content.replace(/\bbg-gray-100\b/g, 'bg-slate-800/80');

  // Borders
  content = content.replace(/\bborder-gray-100\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-100\b/g, 'border-white/10');
  content = content.replace(/\bborder-gray-200\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-200\b/g, 'border-white/10');
  content = content.replace(/\bborder-gray-300\b/g, 'border-white/20');
  content = content.replace(/\bborder-slate-300\b/g, 'border-white/20');

  // Input styling in Dashboard / Chat
  content = content.replace(/\bfocus:ring-primary-500\b/g, 'focus:ring-primary-400');

  // In modals bg-black/40 can stay.

  fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx')) {
      convertFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
console.log('Successfully converted files to dark mode utilities.');
