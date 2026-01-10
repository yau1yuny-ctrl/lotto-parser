import { scrapePanama } from './scrapers/panama.js';

console.log('Testing Panama Scraper with Validation...\n');

scrapePanama()
    .then(results => {
        console.log('\n--- PANAMA RESULTS ---\n');

        let hasErrors = false;

        if (!results || results.length === 0) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        results.forEach(draw => {
            console.log(`Draw: ${draw.title}`);

            if (!draw.prizes || draw.prizes.length === 0) {
                console.error(`  ❌ ERROR: No prizes found for ${draw.title}`);
                hasErrors = true;
            } else {
                draw.prizes.forEach(prize => {
                    console.log(`  ${prize.label}: ${prize.number}`);

                    // Validate number format (4 digits for Panama)
                    if (!/^\d{4}$/.test(prize.number)) {
                        console.error(`    ❌ ERROR: Invalid number format "${prize.number}" (expected 4 digits)`);
                        hasErrors = true;
                    }
                });
            }
            console.log('');
        });

        if (hasErrors) {
            console.error('❌ TEST FAILED: Validation errors found');
            process.exit(1);
        } else {
            console.log('✅ TEST PASSED: All validations successful');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
