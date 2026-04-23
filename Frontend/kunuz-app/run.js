const fs = require('fs');
const files = [
  'C:/Users/windows/Desktop/Projet 2cp/Frontend/kunuz-app/src/components/SharedFeed.tsx',
  'C:/Users/windows/Desktop/Projet 2cp/Frontend/kunuz-app/src/app/home-page/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  // Add import Image and Virtuoso if missing
  if (!content.includes('import Image')) {
    content = content.replace('import React', 'import Image from "next/image";\nimport { Virtuoso } from "react-virtuoso";\nimport React');
  }

  // 1. Replace <img ...> with <Image .../>
  content = content.replace(/<img[\s\S]*?>/g, match => {
    let newMatch = match.replace('<img', '<Image');
    if (!newMatch.endsWith('/>')) {
      newMatch = newMatch.slice(0, -1) + ' />';
    }
    
    if (!newMatch.includes('width=') && !newMatch.includes('fill')) {
      if (newMatch.includes('w-full') && newMatch.includes('h-full')) {
        newMatch = newMatch.replace('/>', 'fill style={{ objectFit: "cover" }} />');
      } else {
        let w = 100, h = 100;
        const wMatch = newMatch.match(/w-\[(\d+)px\]/);
        if (wMatch) w = wMatch[1];
        const hMatch = newMatch.match(/h-\[(\d+)px\]/);
        if (hMatch) h = hMatch[1];
        if (!wMatch && !hMatch) {
            w = 500; h = 500;
        }
        newMatch = newMatch.replace('/>', ' width={' + w + '} height={' + h + '} />');
      }
    }
    return newMatch;
  });

  // 2. Replace {posts.map((post, index) => ( ... ))} with Virtuoso
  const mapStr = '{posts.map((post, index) => (';
  if (content.includes(mapStr)) {
    const parts = content.split(mapStr);
    const before = parts[0];
    const after = parts[1];
    
    let endStr = '))}                  {loading';
    let endIndex = after.indexOf(endStr);
    if (endIndex === -1) {
        endIndex = after.lastIndexOf('))}\n                  {loading');
    }
    if (endIndex === -1) {
        endIndex = after.indexOf('))}\n'); // if no loading
    }
    if (endIndex !== -1) {
        // Wait, just find the next line where it matches  ))} 
        const innerMatch = after.substring(0, endIndex);
        const rest = after.substring(endIndex + 3);
        
        const virtBlock = '<Virtuoso\n                    useWindowScroll\n                    data={posts}\n                    itemContent={(index, post) => (\n                      ' + innerMatch + '\n                    )}\n                  />';
        
        content = before + virtBlock + rest;
    }
  }

  fs.writeFileSync(file, content, 'utf-8');
  console.log('Processed', file);
});
