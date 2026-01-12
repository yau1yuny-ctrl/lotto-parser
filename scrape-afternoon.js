import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - AFTERNOON BLOCK (wait until draw time)');
console.log('Time: 4:50 PM - 10:50 PM Panama');
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

    if (target < now) {
        target = target.plus({ days: 1 });
    }

    const waitMs = target.diff(now).milliseconds;

    if (waitMs > 0) {
        const waitMinutes = Math.round(waitMs / 60000);
        console.log(`⏰ Waiting ${waitMinutes} minutes until ${drawTime}...`);
        await sleep(waitMs);
        console.log(`✅ It's ${drawTime} - starting search now!`);
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

async function scrapeAfternoonDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running afternoon scraper for: ${today}`);
    console.log(`Started at: ${now.toFormat('HH:mm')}`);
    console.log('');

    // 5:30 PM - Costa Rica (Tarde)
    console.log('🇨🇷 Costa Rica (5:30 PM)');
    await waitUntilDrawTime('5:30 PM');
    await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '5:30 PM'),
        'CR Tarde',
        {
            country: 'Costa Rica',
            drawName: 'Monazo Tarde',
            time: '5:30 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 7:00 PM - Dominican Republic + Nicaragua (PARALLEL)
    console.log('⏰ 7:00 PM - Dominican Republic + Nicaragua (parallel)');
    await waitUntilDrawTime('7:00 PM');
    await Promise.all([
        scrapeWithRetry(
            () => scrapeDominicanRepublic(),
            (results) => results?.find(r => r.name.includes('Noche')),
            'DR Noche',
            {
                country: 'Dominican Republic',
                drawName: 'La Primera Noche',
                time: '7:00 PM',
                date: today,
                getNumbers: (r) => r.numbers
            },
            15
        ),
        scrapeWithRetry(
            () => scrapeSuerteNica(),
            (results) => results?.find(r => r.time === '7:00 PM'),
            'Nicaragua 7PM',
            {
                country: 'Nicaragua',
                drawName: 'Nica 7:00 PM',
                time: '7:00 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        )
    ]);

    // 8:30 PM - Costa Rica (Noche)
    console.log('🇨🇷 Costa Rica (8:30 PM)');
    await waitUntilDrawTime('8:30 PM');
    await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '8:30 PM'),
        'CR Noche',
        {
            country: 'Costa Rica',
            drawName: 'Tica Noche',
            time: '8:30 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 9:50 PM - USA (Florida Noche)
    console.log('🇺🇸 USA (9:50 PM)');
    await waitUntilDrawTime('9:50 PM');
    await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('Florida Noche')),
        'USA FL Noche',
        {
            country: 'USA',
            drawName: 'Florida Noche',
            time: '9:50 PM',
            date: today,
            getNumbers: (r) => r.prizes
        },
        15
    );

    // 10:00 PM - Nicaragua + Honduras (PARALLEL)
    console.log('⏰ 10:00 PM - Nicaragua + Honduras (parallel)');
    await waitUntilDrawTime('10:00 PM');
    await Promise.all([
        scrapeWithRetry(
            () => scrapeSuerteNica(),
            (results) => results?.find(r => r.time === '10:00 PM'),
            'Nicaragua 10PM',
            {
                country: 'Nicaragua',
                drawName: 'Nica 10:00 PM',
                time: '10:00 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        ),
        scrapeWithRetry(
            () => scrapeHonduras(),
            (results) => results?.find(r => r.time === '10:00 PM'),
            'Honduras 10PM',
            {
                country: 'Honduras',
                drawName: 'Honduras 10:00 PM',
                time: '10:00 PM',
                date: today,
                getNumbers: (r) => r.prizes
            },
            15
        )
    ]);

    console.log('');
    console.log('='.repeat(60));
    console.log('Afternoon scraper completed!');
    console.log('='.repeat(60));
}

scrapeAfternoonDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
