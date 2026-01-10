import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

async function testStealthPlugin() {
    console.log('Testing Playwright Stealth Plugin on JPS...');
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    try {
        console.log('Navigating to JPS with Stealth...');
        await page.goto('https://www.jps.go.cr/resultados', { waitUntil: 'networkidle', timeout: 60000 });

        console.log('Waiting for content to load...');
        await page.waitForTimeout(15000);

        const title = await page.title();
        console.log('Page Title:', title);

        const content = await page.content();
        if (content.includes('Just a moment') || content.includes('cloudflare-static')) {
            console.log('❌ Cloudflare STILL detected.');
            await page.screenshot({ path: 'stealth_plugin_failed.png' });
        } else {
            console.log('✅ Success! Bypassed Cloudflare with Stealth Plugin.');
            await page.screenshot({ path: 'stealth_plugin_success.png' });

            // Try to find a specific element that only exists after bypass
            const header = await page.locator('h1').innerText().catch(() => '');
            console.log('H1 Text:', header);
        }

    } catch (error) {
        console.error('Error during test:', error.message);
    } finally {
        await browser.close();
    }
}

testStealthPlugin();
