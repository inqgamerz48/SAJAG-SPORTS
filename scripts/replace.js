const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/Delhivery/g, 'Shiprocket');
    content = content.replace(/delhivery/g, 'shiprocket');
    content = content.replace(/DELHIVERY/g, 'SHIPROCKET');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // skip node_modules, .git, .next
            if (['node_modules', '.git', '.next'].includes(file)) continue;
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.json') || fullPath.endsWith('.prisma') || fullPath.endsWith('.md')) {
            replaceInFile(fullPath);
            
            // Rename file if it contains 'delhivery'
            if (file.toLowerCase().includes('delhivery')) {
                const newName = file.replace(/Delhivery/g, 'Shiprocket').replace(/delhivery/g, 'shiprocket');
                const newPath = path.join(dir, newName);
                fs.renameSync(fullPath, newPath);
                console.log(`Renamed: ${fullPath} -> ${newPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'lib'));
processDirectory(path.join(__dirname, 'components'));
processDirectory(path.join(__dirname, 'prisma'));
processDirectory(path.join(__dirname, 'docs'));
