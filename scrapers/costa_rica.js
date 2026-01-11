import { chromium } from 'playwright';

export async function scrapeCostaRica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Starting Costa Rica scraper - loteriascostarica.com');
        await page.goto('https://www.loteriascostarica.com/', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for cards to load
        await page.waitForSelector('.card', { timeout: 30000 });

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        // Extract results
        const results = await page.evaluate((todayStr) => {
            const findCard = (titleText) => {
                return Array.from(document.querySelectorAll('.card')).find(card =>
                    card.querySelector('.card-header')?.innerText?.toUpperCase().includes(titleText.toUpperCase())
                );
            };

            const ticaCard = findCard('TICA DIA REVENTADOS');
            const monazoCard = findCard('MONAZO TICA DIA');

            const draws = [];

            // Process Tica Día Reventados (Prize 1)
            if (ticaCard) {
                const date = ticaCard.querySelector('.card-footer .text-left')?.innerText?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                const time = ticaCard.querySelector('.card-footer .text-right')?.innerText?.match(/\d{2}:\d{2}/)?.[0];

                if (date === todayStr) {
                    const numbers = Array.from(ticaCard.querySelectorAll('.btn-circle')).map(n => n.innerText.trim());
                    const prize1 = numbers[0];

                    // Process Monazo Tica Día (Prizes 2 and 3)
                    if (monazoCard) {
                        const monazoDate = monazoCard.querySelector('.card-footer .text-left')?.innerText?.match(/\d{4}-\d{2}-\d{2}/)?.[0];

                        if (monazoDate === todayStr) {
                            const monazoNumbers = Array.from(monazoCard.querySelectorAll('.btn-circle')).map(n => n.innerText.trim());
                            const fullNumber = monazoNumbers[0] || '';

                            if (fullNumber.length >= 3) {
                                const prize2 = fullNumber.substring(0, 2);
                                const prize3 = fullNumber.substring(fullNumber.length - 2);

                                draws.push({
                                    time: time,
                                    prizes: [prize1, prize2, prize3]
                                });
                            }
                        }
                    }
                }
            }

            return draws;
        }, todayStr);

        await browser.close();

        // Convert Costa Rica times (UTC-6) to Panama times (UTC-5)
        const timeMap = {
            '01:00': '2:55 PM',  // Mediodía
            '13:00': '2:55 PM',  // Alternative format
            '17:30': '6:30 PM',  // Tarde
            '20:30': '9:30 PM'   // Tica (8:30 PM specific days)
        };

        const convertedResults = results.map(result => ({
            time: timeMap[result.time] || result.time,
            prizes: result.prizes
        }));

        console.log('Costa Rica scraping completed:', convertedResults);
        return convertedResults;

    } catch (error) {
        console.error('Error scraping Costa Rica:', error);
        await browser.close();
        return [];
    }
}
