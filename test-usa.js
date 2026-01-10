import { scrapeUSLotteries } from './scrapers/us_lotteries.js';

console.log('Testing USA Lotteries Scraper...\n');

scrapeUSLotteries()
    .then(results => {
        console.log('\n--- USA LOTTERIES RESULTS ---\n');
        if (results && results.length > 0) {
            results.forEach(lottery => {
                console.log(`${lottery.title}`);
                console.log(`Prizes: ${lottery.prizes.join(' - ')}`);
                console.log('');
            });
        } else {
            console.log('No results found.');
        }
    })
    .catch(err => console.error('Error:', err));
