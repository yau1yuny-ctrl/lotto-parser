import { chromium } from 'playwright';

export async function scrapeDominicanRepublic() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://laprimera.do/', { waitUntil: 'networkidle' });

        const results = await page.evaluate(function () {
            // Helper function to convert Dominican Republic time (AST, UTC-4) to Panama time (EST, UTC-5)
            function convertASTtoEST(astTime) {
                if (!astTime) return '';

                // Parse time like "11:00 AM" or "6:00 PM"
                const match = astTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (!match) return astTime; // Return original if can't parse

                let hours = parseInt(match[1]);
                const minutes = match[2];
                const period = match[3].toUpperCase();

                // Convert to 24-hour format
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                // Subtract 1 hour (AST is 1 hour ahead of EST)
                hours -= 1;
                if (hours < 0) hours += 24;

                // Convert back to 12-hour format
                const newPeriod = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);

                return `${displayHours}:${minutes} ${newPeriod}`;
            }

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
                        hour: convertASTtoEST(hour), // Convert to Panama time
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
