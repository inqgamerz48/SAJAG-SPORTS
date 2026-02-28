const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    page.on('console', msg => {
        console.log('CONSOLE:', msg.text());
    });
    
    await page.goto('https://www.sajagsports.store', { waitUntil: 'networkidle2' });
    await browser.close();
})();
