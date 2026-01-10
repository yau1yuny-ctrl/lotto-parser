import { chromium } from 'playwright';

export async function scrapeSuerteNica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://suertenica.com/', { waitUntil: 'networkidle' });

        const results = await page.evaluate(function () {
            const sections = Array.from(document.querySelectorAll('.resultados-container, .shortcode-container'));
            return sections.map(function (section) {
                const title = section.querySelector('h2.titulosorteo') ? section.querySelector('h2.titulosorteo').innerText.trim() : '';
                const draws = Array.from(section.querySelectorAll('.resultado')).map(function (res) {
                    const drawText = res.querySelector('p') ? res.querySelector('p').innerText.trim() : '';
                    const numbers = Array.from(res.querySelectorAll('.bolilla')).map(function (b) { return b.innerText.trim(); });
                    return { drawText: drawText, numbers: numbers };
                });
                return { title: title, draws: draws };
            }).filter(function (game) {
                const lowerTitle = game.title.toLowerCase();
                return lowerTitle.includes('diaria') || lowerTitle.includes('premia 2');
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
