const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
        }
    });
    
    await page.goto('https://www.sajagsports.store', { waitUntil: 'networkidle2' });
    await browser.close();
})();
