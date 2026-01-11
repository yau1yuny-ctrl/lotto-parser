import { scrapeUSLotteries } from './scrapers/us_lotteries.js';

console.log('Debugging USA Lotteries Scraper...\n');

scrapeUSLotteries()
    .then(results => {
        console.log('\n--- RAW RESULTS ---\n');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
