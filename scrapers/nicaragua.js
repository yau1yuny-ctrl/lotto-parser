import { chromium } from 'playwright';

export async function scrapeSuerteNica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://suertenica.com/', { waitUntil: 'networkidle' });

        const results = await page.evaluate(() => {
            const sections = Array.from(document.querySelectorAll('.resultados-container, .shortcode-container'));
            return sections.map(section => {
                const title = section.querySelector('h2.titulosorteo')?.innerText.trim();
                const draws = Array.from(section.querySelectorAll('.resultado')).map(res => {
                    const drawText = res.querySelector('p')?.innerText.trim();
                    const numbers = Array.from(res.querySelectorAll('.bolilla')).map(b => b.innerText.trim());
                    return { drawText, numbers };
                });
                return { title, draws };
            });
        });

        return results;
    } catch (error) {
        console.error('Error scraping SuerteNica:', error);
        return null;
    } finally {
        await browser.close();
    }
}
