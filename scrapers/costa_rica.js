import { chromium } from 'playwright';

export async function scrapeCostaRica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://jps.go.cr/resultados', { waitUntil: 'networkidle' });

        const results = await page.evaluate(function () {
            const data = [];
            const sections = document.querySelectorAll('.view-resultados-individuales .views-row');
            sections.forEach(function (row) {
                const nameElem = row.querySelector('.views-field-title');
                const numberElem = row.querySelector('.views-field-field-numero-ganador');
                const serieElem = row.querySelector('.views-field-field-serie-ganadora');

                const name = nameElem ? nameElem.innerText.trim() : '';
                const number = numberElem ? numberElem.innerText.trim() : '';
                const serie = serieElem ? serieElem.innerText.trim() : '';

                if (name && number) {
                    data.push({ name: name, number: number, serie: serie });
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
