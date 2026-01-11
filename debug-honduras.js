import { scrapeHonduras } from './scrapers/honduras.js';

console.log('Debugging Honduras Scraper...\n');

scrapeHonduras()
    .then(results => {
        console.log('\n--- RAW RESULTS ---\n');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
