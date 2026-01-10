import { scrapeCostaRica } from './scrapers/costa_rica.js';

console.log('Testing Costa Rica Scraper with Validation...\n');

scrapeCostaRica()
    .then(results => {
        console.log('\n--- COSTA RICA RESULTS ---\n');

        let hasErrors = false;

        if (!results || results.length === 0) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        results.forEach(draw => {
            console.log(`Draw: ${draw.time}`);

            if (!draw.prizes || draw.prizes.length !== 3) {
                console.error(`  ❌ ERROR: Expected 3 prizes, got ${draw.prizes?.length || 0}`);
                hasErrors = true;
            } else {
                draw.prizes.forEach((prize, idx) => {
                    const label = ['1er Premio', '2do Premio', '3er Premio'][idx];
                    console.log(`  ${label}: ${prize}`);

                    // Validate that prize is a 2-digit number
                    if (!/^\d{2}$/.test(prize)) {
                        console.error(`    ❌ ERROR: Prize should be 2 digits, got "${prize}"`);
                        hasErrors = true;
                    }
                });
            }
            console.log('');
        });

        // Check that we have all expected draws
        const expectedDraws = ['Mediodía', 'Tarde', 'Noche', '8:30 PM Tica'];
        const foundDraws = results.map(r => r.time);

        expectedDraws.forEach(expected => {
            if (!foundDraws.includes(expected)) {
                console.error(`❌ ERROR: Missing draw "${expected}"`);
                hasErrors = true;
            }
        });

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
