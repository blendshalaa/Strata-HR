const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/hr-genie-frontend/src');

const replacements = [
    // Hex colors
    { from: /#3B5BDB/gi, to: '#111318' },
    { from: /#2F4AC0/gi, to: '#374151' },
    { from: /#EEF2FF/gi, to: '#F3F4F6' },
    { from: /#E0DEFF/gi, to: '#E5E7EB' },
    { from: /#C7D2FE/gi, to: '#A1A1AA' },
    { from: /#A89CFF/gi, to: '#71717A' },
    
    // Tailwind blue
    { from: /text-blue-50/g, to: 'text-zinc-50' },
    { from: /text-blue-100/g, to: 'text-zinc-100' },
    { from: /text-blue-200/g, to: 'text-zinc-200' },
    { from: /text-blue-300/g, to: 'text-zinc-300' },
    { from: /text-blue-400/g, to: 'text-zinc-400' },
    { from: /text-blue-500/g, to: 'text-zinc-500' },
    { from: /text-blue-600/g, to: 'text-zinc-600' },
    { from: /text-blue-700/g, to: 'text-zinc-700' },
    { from: /text-blue-800/g, to: 'text-zinc-800' },
    { from: /text-blue-900/g, to: 'text-zinc-900' },

    { from: /bg-blue-50\b/g, to: 'bg-zinc-50' },
    { from: /bg-blue-100\b/g, to: 'bg-zinc-100' },
    { from: /bg-blue-200\b/g, to: 'bg-zinc-200' },
    { from: /bg-blue-300\b/g, to: 'bg-zinc-300' },
    { from: /bg-blue-400\b/g, to: 'bg-zinc-400' },
    { from: /bg-blue-500\b/g, to: 'bg-zinc-500' },
    { from: /bg-blue-600\b/g, to: 'bg-zinc-600' },
    { from: /bg-blue-700\b/g, to: 'bg-zinc-700' },
    { from: /bg-blue-800\b/g, to: 'bg-zinc-800' },
    { from: /bg-blue-900\b/g, to: 'bg-zinc-900' },

    { from: /border-blue-50\b/g, to: 'border-zinc-50' },
    { from: /border-blue-100\b/g, to: 'border-zinc-100' },
    { from: /border-blue-200\b/g, to: 'border-zinc-200' },
    { from: /border-blue-300\b/g, to: 'border-zinc-300' },
    { from: /border-blue-400\b/g, to: 'border-zinc-400' },
    { from: /border-blue-500\b/g, to: 'border-zinc-500' },
    { from: /border-blue-600\b/g, to: 'border-zinc-600' },
    { from: /border-blue-700\b/g, to: 'border-zinc-700' },
    { from: /border-blue-800\b/g, to: 'border-zinc-800' },
    { from: /border-blue-900\b/g, to: 'border-zinc-900' },

    { from: /ring-blue-50\b/g, to: 'ring-zinc-50' },
    { from: /ring-blue-100\b/g, to: 'ring-zinc-100' },
    { from: /ring-blue-200\b/g, to: 'ring-zinc-200' },
    { from: /ring-blue-300\b/g, to: 'ring-zinc-300' },
    { from: /ring-blue-400\b/g, to: 'ring-zinc-400' },
    { from: /ring-blue-500\b/g, to: 'ring-zinc-500' },
    { from: /ring-blue-600\b/g, to: 'ring-zinc-600' },
    { from: /ring-blue-700\b/g, to: 'ring-zinc-700' },
    { from: /ring-blue-800\b/g, to: 'ring-zinc-800' },
    { from: /ring-blue-900\b/g, to: 'ring-zinc-900' },

    { from: /hover:bg-blue-50\b/g, to: 'hover:bg-zinc-50' },
    { from: /hover:bg-blue-100\b/g, to: 'hover:bg-zinc-100' },
    { from: /hover:bg-blue-600\b/g, to: 'hover:bg-zinc-600' },
    { from: /hover:bg-blue-700\b/g, to: 'hover:bg-zinc-700' },
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            replacements.forEach(({from, to}) => {
                if (from.test(content)) {
                    content = content.replace(from, to);
                    modified = true;
                }
            });
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directoryPath);
console.log('Mass replacement complete.');
