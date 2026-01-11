import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';

console.log('Debugging Dominican Republic Scraper...\n');

scrapeDominicanRepublic()
    .then(results => {
        console.log('\n--- RAW RESULTS ---\n');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
