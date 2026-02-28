const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('pageerror', error => {
        console.log('Page error:', error.message);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
        }
    });
    
    await page.goto('https://www.sajagsports.store', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
