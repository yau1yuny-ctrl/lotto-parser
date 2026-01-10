import { scrapePanama } from './scrapers/panama.js';

console.log('Testing Panama Scraper...\n');

scrapePanama()
    .then(results => {
        console.log('\n--- PANAMA RESULTS ---\n');
        if (results && results.length > 0) {
            results.forEach(draw => {
                console.log(`Draw: ${draw.title}`);
                draw.prizes.forEach(prize => {
                    console.log(`  ${prize.label}: ${prize.number}`);
                });
                console.log('');
            });
        } else {
            console.log('No results found.');
        }
    })
    .catch(err => console.error('Error:', err));
