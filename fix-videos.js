const fs = require('fs');
const path = '/Users/thotashivavarun/Downloads/SajagNew/components/home-page-client.tsx';
let source = fs.readFileSync(path, 'utf8');

// The sed command earlier created messy strings
source = source.replace(/\/videos\/racquet-restoration-\/videos\/WhatsApp Video 2026-01-18 at 21\.28\.02\.mp4\.mp4/g, '/videos/racquet-restoration-1.mp4');
source = source.replace(/\/videos\/racquet-restoration-\/videos\/WhatsApp Video 2026-01-18 at 21\.28\.04\.mp4\.mp4/g, '/videos/racquet-restoration-2.mp4');
source = source.replace(/\/videos\/racquet-restoration-\/videos\/WhatsApp Video 2026-01-18 at 21\.28\.10\.mp4\.mp4/g, '/videos/racquet-restoration-3.mp4');

fs.writeFileSync(path, source, 'utf8');
