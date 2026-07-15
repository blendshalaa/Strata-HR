const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.css') || dirFile.endsWith('.js') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  if (file.includes('Sidebar.jsx')) {
     // For the dark sidebar, active indicators/accents should be white
     content = content.replace(/#3B5BDB/gi, '#FFFFFF');
     content = content.replace(/#2F4AC0/gi, '#F3F4F6');
     content = content.replace(/#EEF2FF/gi, 'rgba(255,255,255,0.1)');
  } else {
     // Pure Monochrome for general components
     content = content.replace(/#3B5BDB/gi, '#111318');
     content = content.replace(/#2F4AC0/gi, '#374151');
     content = content.replace(/#EEF2FF/gi, '#F3F4F6');
  }
  
  content = content.replace(/rgba\(\s*59\s*,\s*91\s*,\s*219\s*,\s*0.12\s*\)/gi, 'rgba(17,19,24,0.12)');
  content = content.replace(/rgba\(\s*59\s*,\s*91\s*,\s*219\s*,\s*0.1\s*\)/gi, 'rgba(17,19,24,0.1)');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
console.log('Monochrome sweep complete!');
