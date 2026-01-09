import { chromium } from 'playwright';

export async function scrapeCostaRica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://jps.go.cr/resultados', { waitUntil: 'networkidle' });

        const results = await page.evaluate(() => {
            const data = [];
            const sections = document.querySelectorAll('.view-resultados-individuales .views-row');
            sections.forEach(row => {
                const name = row.querySelector('.views-field-title')?.innerText.trim();
                const number = row.querySelector('.views-field-field-numero-ganador')?.innerText.trim();
                const serie = row.querySelector('.views-field-field-serie-ganadora')?.innerText.trim();
                if (name && number) {
                    data.push({ name, number, serie });
                }
            });
            return data;
        });

        return results;
    } catch (error) {
        console.error('Error scraping Costa Rica:', error);
        return null;
    } finally {
        await browser.close();
    }
}
