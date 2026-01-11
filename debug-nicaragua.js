import { scrapeSuerteNica } from './scrapers/nicaragua.js';

console.log('Debugging Nicaragua Scraper...\n');

scrapeSuerteNica()
    .then(results => {
        console.log('\n--- RAW RESULTS ---\n');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
