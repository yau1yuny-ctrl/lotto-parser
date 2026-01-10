import { scrapeHonduras } from './scrapers/honduras.js';

console.log('Testing Honduras Scraper with Validation...\n');

scrapeHonduras()
    .then(results => {
        console.log('\n--- HONDURAS RESULTS ---\n');

        let hasErrors = false;

        if (!results) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        console.log(`Date: ${results.date}\n`);

        // Check for required games
        const requiredGames = ['DIARIA', 'PREMIA2'];
        requiredGames.forEach(game => {
            if (!results.games[game]) {
                console.error(`❌ ERROR: Missing game "${game}"`);
                hasErrors = true;
            } else {
                console.log(`${game}: ${results.games[game].join(' - ')}`);

                // Validate number format
                results.games[game].forEach(num => {
                    if (!/^\d{2}$/.test(num)) {
                        console.error(`  ❌ ERROR: Invalid number format "${num}" (expected 2 digits)`);
                        hasErrors = true;
                    }
                });
            }
        });

        if (hasErrors) {
            console.error('\n❌ TEST FAILED: Validation errors found');
            process.exit(1);
        } else {
            console.log('\n✅ TEST PASSED: All validations successful');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
