import { scrapeSuerteNica } from './scrapers/nicaragua.js';

console.log('Testing Nicaragua Scraper...\n');

scrapeSuerteNica()
    .then(results => {
        console.log('\n--- NICARAGUA RESULTS ---\n');
        if (results && results.length > 0) {
            results.forEach(game => {
                console.log(`Game: ${game.title}`);
                game.draws.forEach(draw => {
                    console.log(`  ${draw.drawText}: ${draw.numbers.join(' - ')}`);
                });
                console.log('');
            });
        } else {
            console.log('No results found.');
        }
    })
    .catch(err => console.error('Error:', err));
