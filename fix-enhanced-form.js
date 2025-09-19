const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/components/admin/enhanced-competition-form.tsx', 'utf8');

// Find and comment out all the problematic function bodies
const functionsToFix = [
  'handleGetCoordinates',
  'handleManualSet', 
  'handleSaveCoordinates',
  'handleRemoveBall',
  'handleAcceptInpainted'
];

functionsToFix.forEach(funcName => {
  // Find the commented function declaration
  const regex = new RegExp(`(\\s*// const ${funcName}[^{]*\\{ // UNUSED[^\\n]*\\n)((?:(?!\\n\\s*(?:const|function|//)).+\\n)*)(\\s*\\})`);
  
  content = content.replace(regex, (match, declaration, body, closingBrace) => {
    // Comment out the entire body
    const commentedBody = body.split('\n').map(line => 
      line.trim() === '' ? '//' : '  //' + line
    ).join('\n');
    
    return declaration + commentedBody + '\n  // }';
  });
});

// Write the file back
fs.writeFileSync('src/components/admin/enhanced-competition-form.tsx', content);
console.log('Fixed all function bodies!');
