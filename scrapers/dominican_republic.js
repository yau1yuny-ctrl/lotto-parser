import { chromium } from 'playwright';

export async function scrapeDominicanRepublic() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://laprimera.do/', { waitUntil: 'networkidle' });

        const results = await page.evaluate(function () {
            const cards = document.querySelectorAll('aside.card-lottery');
            const data = [];

            cards.forEach(function (card) {
                const imgEl = card.querySelector('.img');
                const bgImage = imgEl ? window.getComputedStyle(imgEl).backgroundImage : '';

                // Extract name from background-image URL
                let name = 'Unknown';
                const match = bgImage.match(/logo-(.+?)\.svg/);
                if (match && match[1]) {
                    name = match[1].replace(/-/g, ' ').replace(/\?v=\d+/, '').trim();
                }

                const dateEl = card.querySelector('.date');
                const hourEl = card.querySelector('.hour');
                const date = dateEl ? dateEl.innerText.trim() : '';
                const hour = hourEl ? hourEl.innerText.trim() : '';

                const numbers = [];
                const amountEls = card.querySelectorAll('.amount');
                amountEls.forEach(function (numEl) {
                    numbers.push(numEl.innerText.trim());
                });

                if (name && numbers.length > 0) {
                    data.push({
                        name: name,
                        date: date,
                        hour: hour,
                        numbers: numbers
                    });
                }
            });

            return data;
        });

        return results;
    } catch (error) {
        console.error('Error scraping Dominican Republic:', error);
        return null;
    } finally {
        await browser.close();
    }
}
