import { chromium } from 'playwright';

async function testStealth() {
    console.log('Testing manual stealth techniques on JPS...');
    const browser = await chromium.launch({ headless: true });

    // Create a context with a real user agent
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
    });

    // Add a script to hide automation flags
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    const page = await context.newPage();
    try {
        console.log('Navigating to JPS...');
        await page.goto('https://www.jps.go.cr/resultados', { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log('Waiting to see if Cloudflare appears...');
        await page.waitForTimeout(10000);

        const title = await page.title();
        console.log('Page Title:', title);

        const content = await page.content();
        if (content.includes('Just a moment') || content.includes('cloudflare')) {
            console.log('❌ Cloudflare detected.');
            await page.screenshot({ path: 'cloudflare_detected.png' });
        } else {
            console.log('✅ Successfully bypassed Cloudflare (potentially).');
            await page.screenshot({ path: 'jps_bypassed.png' });
        }

    } catch (error) {
        console.error('Error during test:', error.message);
    } finally {
        await browser.close();
    }
}

testStealth();
