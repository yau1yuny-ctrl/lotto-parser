import { scrapeHonduras } from './scrapers/honduras.js';

console.log('Testing Honduras Scraper...\n');

scrapeHonduras()
    .then(results => {
        console.log('\n--- HONDURAS RESULTS ---\n');
        if (results) {
            console.log(`Date: ${results.date}\n`);
            Object.keys(results.games).forEach(game => {
                console.log(`${game}: ${results.games[game].join(' - ')}`);
            });
        } else {
            console.log('No results found.');
        }
    })
    .catch(err => console.error('Error:', err));
