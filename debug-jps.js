import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

chromium.use(stealth());

async function dumpJPS() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    try {
        await page.goto('https://www.jps.go.cr/resultados', { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(15000);
        const content = await page.content();
        fs.writeFileSync('jps_dump.html', content);
        const text = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('jps_text.txt', text);
        console.log('Dumped JPS content to jps_dump.html and jps_text.txt');
    } finally {
        await browser.close();
    }
}
dumpJPS();
