import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';

console.log('Testing Dominican Republic Scraper...\n');

scrapeDominicanRepublic()
    .then(results => {
        console.log('\n--- DOMINICAN REPUBLIC RESULTS ---\n');
        if (results && results.length > 0) {
            results.forEach(lottery => {
                console.log(`Lottery: ${lottery.name}`);
                console.log(`Date: ${lottery.date} - ${lottery.hour}`);
                console.log(`Numbers: ${lottery.numbers.join(' - ')}`);
                console.log('');
            });
        } else {
            console.log('No results found.');
        }
    })
    .catch(err => console.error('Error:', err));
