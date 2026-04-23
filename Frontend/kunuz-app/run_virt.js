const fs = require('fs');
const files = [
  'C:/Users/windows/Desktop/Projet 2cp/Frontend/kunuz-app/src/components/SharedFeed.tsx',
  'C:/Users/windows/Desktop/Projet 2cp/Frontend/kunuz-app/src/app/home-page/page.tsx'
];

files.forEach(file => {
  let text = fs.readFileSync(file, 'utf-8');
  
  // map for the main posts feed
  const mapRegex = /\{posts\.map\(\([\s\S]*?=>\s*\([\s\S]*?<\/React\.Fragment>\s*\)\)\}/g;
  
  text = text.replace(mapRegex, (match) => {
     let inner = match.replace(/\{posts\.map\(\(post, index\) => \(/, '');
     inner = inner.replace(/<\/React\.Fragment>[\s\S]*?\)\)\}/, '</React.Fragment>');
     
     return '<Virtuoso\n                    useWindowScroll\n                    data={posts}\n                    itemContent={(index, post) => (\n' + inner + '\n                    )}\n                  />';
  });

  // map for search results (only in SharedFeed)
  const searchMapRegex = /\{searchResults\.posts\.map\(\(post.*?=>\s*\([\s\S]*?<\/button>\s*\)\)\}/g;
  text = text.replace(searchMapRegex, (match) => {
     let inner = match.replace(/\{searchResults\.posts\.map\(\(post\) => \(/, '');
     inner = inner.replace(/<\/button>[\s\S]*?\)\)\}/, '</button>');
     
     return '<Virtuoso\n                            style={{ height: \"300px\" }}\n                            data={searchResults.posts}\n                            itemContent={(index, post) => (\n' + inner + '\n                            )}\n                          />';
  });

  fs.writeFileSync(file, text);
  console.log('Done', file);
});
