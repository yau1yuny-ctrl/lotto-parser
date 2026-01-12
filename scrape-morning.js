import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - MORNING BLOCK (wait until draw time)');
console.log('Time: 10:50 AM - 4:50 PM Panama');
console.log('='.repeat(60));
console.log('');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilDrawTime(drawTime) {
    const now = DateTime.now().setZone('America/Panama');
    const [hour, minute] = drawTime.split(':');
    const period = drawTime.includes('PM') ? 'PM' : 'AM';

    let targetHour = parseInt(hour);
    if (period === 'PM' && targetHour !== 12) targetHour += 12;
    if (period === 'AM' && targetHour === 12) targetHour = 0;

    let target = now.set({
        hour: targetHour,
        minute: parseInt(minute.replace(/[^\d]/g, '')),
        second: 0,
        millisecond: 0
    });

    const waitMs = target.diff(now).milliseconds;

    // Only wait if the time hasn't passed yet
    if (waitMs > 0) {
        const waitMinutes = Math.round(waitMs / 60000);
        console.log(`⏰ Waiting ${waitMinutes} minutes until ${drawTime}...`);
        await sleep(waitMs);
        console.log(`✅ It's ${drawTime} - starting search now!`);
    } else {
        console.log(`✅ ${drawTime} already passed - starting search immediately!`);
    }
}

async function saveToSupabase(country, drawName, time, numbers, date) {
    try {
        const { error } = await supabase
            .from('lottery_results')
            .insert([{
                country: country,
                draw_name: drawName,
                draw_date: date,
                data: [{ time: time, numbers: numbers }],
                scraped_at: new Date().toISOString()
            }]);

        if (error) {
            console.error(`❌ Supabase error:`, error);
            return false;
        } else {
            console.log(`💾 Saved to Supabase: ${country} ${time}`);
            return true;
        }
    } catch (e) {
        console.error(`❌ Save error:`, e.message);
        return false;
    }
}

async function scrapeWithRetry(scrapeFn, filterFn, name, saveData, maxAttempts = 15) {
    let found = false;
    let attempts = 0;

    console.log(`🔄 ${name} - starting retry loop (max ${maxAttempts} attempts)...`);

    while (!found && attempts < maxAttempts) {
        attempts++;
        console.log(`  Attempt ${attempts}/${maxAttempts}...`);

        try {
            const results = await scrapeFn();
            const result = filterFn(results);

            if (result) {
                console.log(`  ✅ Found!`);

                // Save immediately to Supabase
                await saveToSupabase(
                    saveData.country,
                    saveData.drawName,
                    saveData.time,
                    saveData.getNumbers(result),
                    saveData.date
                );

                found = true;
                return result;
            } else {
                if (attempts < maxAttempts) {
                    console.log(`  ⏳ Not found. Waiting 2 minutes...`);
                    await sleep(120000);
                } else {
                    console.log(`  ❌ Not found after ${maxAttempts} attempts.`);
                }
            }
        } catch (e) {
            console.error(`  ❌ Error:`, e.message);
            if (attempts < maxAttempts) {
                await sleep(120000);
            }
        }
    }

    return null;
}

async function scrapeMorningDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');
    const dayOfWeek = now.weekday;

    console.log(`Running morning scraper for: ${today}`);
    console.log(`Day of week: ${dayOfWeek} (${now.toFormat('cccc')})`);
    console.log(`Started at: ${now.toFormat('HH:mm')}`);
    console.log('');

    // 11:00 AM - Dominican Republic (La Primera Día)
    console.log('🇩🇴 Dominican Republic (11:00 AM)');
    await waitUntilDrawTime('11:00 AM');
    await scrapeWithRetry(
        () => scrapeDominicanRepublic(),
        (results) => results?.find(r => r.name.includes('Día')),
        'DR Día',
        {
            country: 'Dominican Republic',
            drawName: 'La Primera Día',
            time: '11:00 AM',
            date: today,
            getNumbers: (r) => r.numbers
        },
        15
    );

    // 12:00 PM - Honduras
    console.log('🇭🇳 Honduras (12:00 PM)');
    await waitUntilDrawTime('12:00 PM');
    await scrapeWithRetry(
        () => scrapeHonduras(),
        (results) => results?.find(r => r.time === '12:00 PM'),
        'Honduras 12PM',
        {
            country: 'Honduras',
            drawName: 'Honduras 12:00 PM',
            time: '12:00 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 1:00 PM - Nicaragua
    console.log('🇳🇮 Nicaragua (1:00 PM)');
    await waitUntilDrawTime('1:00 PM');
    await scrapeWithRetry(
        () => scrapeSuerteNica(),
        (results) => results?.find(r => r.time === '1:00 PM'),
        'Nicaragua 1PM',
        {
            country: 'Nicaragua',
            drawName: 'Nica 1:00 PM',
            time: '1:00 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 2:55 PM - Costa Rica (Mediodía)
    console.log('🇨🇷 Costa Rica (2:55 PM)');
    await waitUntilDrawTime('2:55 PM');
    await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '2:55 PM'),
        'CR Mediodía',
        {
            country: 'Costa Rica',
            drawName: 'Monazo Mediodía',
            time: '2:55 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 3:30 PM - USA (New York)
    console.log('🇺🇸 USA (3:30 PM)');
    await waitUntilDrawTime('3:30 PM');
    await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('New York 3:30')),
        'USA NY 3:30PM',
        {
            country: 'USA',
            drawName: 'New York 3:30 PM',
            time: '3:30 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 3:30 PM - Panama (Miércoles=3 y Domingo=7)
    if (dayOfWeek === 3 || dayOfWeek === 7) {
        console.log('🇵🇦 Panama (3:30 PM - Wednesday/Sunday)');
        await waitUntilDrawTime('3:30 PM');
        await scrapeWithRetry(
            () => scrapePanama(),
            (results) => results && results.length > 0 ? results[0] : null,
            'Panama',
            {
                country: 'Panama',
                drawName: 'Loteria Nacional',
                time: '3:30 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        );
    } else {
        console.log('⏭️  Panama: Not Wednesday or Sunday, skipping');
    }

    // 4:00 PM - Nicaragua + Honduras (PARALLEL - both wait until 4:00 PM)
    console.log('⏰ 4:00 PM - Nicaragua + Honduras (parallel)');
    await waitUntilDrawTime('4:00 PM');
    await Promise.all([
        scrapeWithRetry(
            () => scrapeSuerteNica(),
            (results) => results?.find(r => r.time === '4:00 PM'),
            'Nicaragua 4PM',
            {
                country: 'Nicaragua',
                drawName: 'Nica 4:00 PM',
                time: '4:00 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        ),
        scrapeWithRetry(
            () => scrapeHonduras(),
            (results) => results?.find(r => r.time === '4:00 PM'),
            'Honduras 4PM',
            {
                country: 'Honduras',
                drawName: 'Honduras 4:00 PM',
                time: '4:00 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        )
    ]);

    console.log('');
    console.log('='.repeat(60));
    console.log('Morning scraper completed!');
    console.log('='.repeat(60));
}

scrapeMorningDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
