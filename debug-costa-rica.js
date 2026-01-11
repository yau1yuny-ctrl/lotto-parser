import { scrapeCostaRica } from './scrapers/costa_rica.js';

console.log('Debugging Costa Rica Scraper...\n');

scrapeCostaRica()
    .then(results => {
        console.log('\n--- RAW RESULTS ---\n');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
