const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const srcPath = path.resolve('c:/Users/parag/OneDrive/Desktop/GC1/gyancode-platform/frontend/src');
const files = walk(srcPath);

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Padding & Gaps
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bp-8\b/g, 'p-4 sm:p-8');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bp-6\b/g, 'p-4 sm:p-6');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bgap-8\b/g, 'gap-4 sm:gap-8');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bgap-6\b/g, 'gap-4 sm:gap-6');
  
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bpx-8\b/g, 'px-4 sm:px-8');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bpx-6\b/g, 'px-4 sm:px-6');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bpy-8\b/g, 'py-4 sm:py-8');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\bpy-6\b/g, 'py-4 sm:py-6');
  
  // Text sizes
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\btext-3xl\b/g, 'text-2xl sm:text-3xl');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\btext-4xl\b/g, 'text-3xl sm:text-4xl');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\btext-5xl\b/g, 'text-3xl sm:text-5xl');
  content = content.replace(/(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)\btext-6xl\b/g, 'text-4xl sm:text-6xl');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
    console.log(`Updated ${path.basename(file)}`);
  }
});

console.log(`Total files updated: ${totalReplaced}`);
