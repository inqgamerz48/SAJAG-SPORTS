const fs = require('fs');
const content = fs.readFileSync('node_modules/next/dist/server/web/spec-extension/revalidate.d.ts', 'utf8');
console.log(content.match(/export declare function revalidateTag[\s\S]*?\;/)[0]);
