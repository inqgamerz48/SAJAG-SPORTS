const fs = require('fs');

const path = '/Users/thotashivavarun/Downloads/SajagNew/components/stringing-form.tsx';
let source = fs.readFileSync(path, 'utf8');

// Ensure correct values matching your form changes where needed
source = source.replace(/add to cart/g, "Add to Cart"); 

// Update submit line
source = source.replace(/\["Confirm Items \& Proceed to Cart"\]/, "'Add to Cart'");

fs.writeFileSync(path, source, 'utf8');

const homePath = '/Users/thotashivavarun/Book/SajagNew/components/home-page-client.tsx';
// No need to manipulate if sed already worked, but just in case
