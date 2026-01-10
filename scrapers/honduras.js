import { chromium } from 'playwright';

async function getGameResults(page, url, gameName) {
    console.log(`Fetching ${gameName} results from ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(6000);

    // Close modals
    await page.evaluate(function () {
        const btns = document.querySelectorAll('.pum-close, #pum-close, .close-modal, .et_social_close');
        btns.forEach(b => b.click());
    });

    return await page.evaluate(function (game) {
        const results = {};
        const rows = document.querySelectorAll('.Rtable');

        // We only want the results for the latest date shown on the page
        // Usually the first few rows.
        rows.forEach(row => {
            const head = row.querySelector('.Rtable-cell--head');
            const dataCell = row.querySelector('.Rtable-cell.border-left-td');
            if (head && dataCell) {
                const headText = head.innerText.trim();
                const timeMatch = headText.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);

                if (timeMatch) {
                    const time = timeMatch[0].toUpperCase();
                    // If we already have a result for this time, it's likely from an older date
                    if (results[time]) return;

                    const allDigits = Array.from(dataCell.querySelectorAll('.esferas span'))
                        .map(s => s.innerText.trim())
                        .filter(n => n.length > 0 && !isNaN(n));

                    if (game === 'DIARIA') {
                        // Diaria might show the digit and more info. 
                        // According to subagent, it's just the digits in spans.
                        const digits = allDigits.slice(0, 2).join('');
                        if (digits) results[time] = [digits];
                    } else if (game === 'PREMIA2') {
                        const pairs = [];
                        for (let i = 0; i < allDigits.length; i += 2) {
                            const pair = allDigits.slice(i, i + 2).join('');
                            if (pair) pairs.push(pair);
                            if (pairs.length === 2) break; // We only need the first two pairs
                        }
                        if (pairs.length > 0) results[time] = pairs;
                    }
                }
            }
        });
        return results;
    }, gameName);
}

export async function scrapeHonduras() {
    console.log('Starting Honduras scraper - Composite Final Attempt...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(120000);

        const diaria = await getGameResults(page, 'https://loto.hn/diaria/', 'DIARIA');
        const premia2 = await getGameResults(page, 'https://loto.hn/premia2/', 'PREMIA2');

        const finalData = [];
        const allTimes = ['11:00 AM', '3:00 PM', '9:00 PM'];

        allTimes.forEach(time => {
            const d = diaria[time];
            const p = premia2[time];
            if (d && p && p.length >= 2) {
                finalData.push({
                    time: time,
                    prizes: [d[0], p[0], p[1]]
                });
            }
        });

        return finalData;
    } catch (error) {
        console.error('Error in Honduras Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
