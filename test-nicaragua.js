import { scrapeSuerteNica } from './scrapers/nicaragua.js';

console.log('Testing Nicaragua Scraper with Validation...\n');

scrapeSuerteNica()
    .then(results => {
        console.log('\n--- NICARAGUA RESULTS ---\n');

        let hasErrors = false;

        if (!results || results.length === 0) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        results.forEach(game => {
            console.log(`Game: ${game.title}`);

            if (!game.draws || game.draws.length === 0) {
                console.error(`  ❌ ERROR: No draws found for ${game.title}`);
                hasErrors = true;
            } else {
                game.draws.forEach(draw => {
                    console.log(`  ${draw.drawText}: ${draw.numbers.join(' - ')}`);

                    // Validate that we have numbers
                    if (!draw.numbers || draw.numbers.length === 0) {
                        console.error(`    ❌ ERROR: No numbers found for ${draw.drawText}`);
                        hasErrors = true;
                    }

                    // Validate number format (should be 2 digits)
                    draw.numbers.forEach(num => {
                        if (!/^\d{2}$/.test(num)) {
                            console.error(`    ❌ ERROR: Invalid number format "${num}" (expected 2 digits)`);
                            hasErrors = true;
                        }
                    });
                });
            }
            console.log('');
        });

        // Check that we have Diaria and Premia 2
        const gameNames = results.map(g => g.title.toLowerCase());
        if (!gameNames.some(n => n.includes('diaria'))) {
            console.error('❌ ERROR: Missing "Diaria" game');
            hasErrors = true;
        }
        if (!gameNames.some(n => n.includes('premia'))) {
            console.error('❌ ERROR: Missing "Premia 2" game');
            hasErrors = true;
        }

        if (hasErrors) {
            console.error('\n❌ TEST FAILED: Validation errors found');
            process.exit(1);
        } else {
            console.log('✅ TEST PASSED: All validations successful');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
