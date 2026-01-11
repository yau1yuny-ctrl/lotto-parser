import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../utils/stealth-browser.cjs');

// Stealth plugin configured via CommonJS wrapper

export async function scrapeCostaRica() {
    console.log('Starting Costa Rica scraper (8:30 PM Tica - Schedule Refined)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to JPS results page...');
        await page.goto('https://www.jps.go.cr/resultados', { waitUntil: 'networkidle', timeout: 90000 });

        console.log('Waiting for content...');
        await page.waitForTimeout(15000);

        const results = await page.evaluate(function () {
            const finalData = [];
            const draws = ['Mediodía', 'Tarde', 'Noche'];

            const bodyText = document.body.innerText;
            const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // 1. Identify the LATEST date on the page (e.g. "Viernes, 9 de Enero")
            // This determines which rule to apply for the "8:30 PM Tica" draw
            const dateLine = lines.find(l =>
                l.includes('Lunes') || l.includes('Martes') || l.includes('Miércoles') ||
                l.includes('Jueves') || l.includes('Viernes') || l.includes('Sábado') ||
                l.includes('Domingo')
            );

            let dayOfWeek = "";
            if (dateLine) {
                if (dateLine.includes('Lunes')) dayOfWeek = 'LUNES';
                else if (dateLine.includes('Martes')) dayOfWeek = 'MARTES';
                else if (dateLine.includes('Miércoles')) dayOfWeek = 'MIÉRCOLES';
                else if (dateLine.includes('Jueves')) dayOfWeek = 'JUEVES';
                else if (dateLine.includes('Viernes')) dayOfWeek = 'VIERNES';
                else if (dateLine.includes('Sábado')) dayOfWeek = 'SÁBADO';
                else if (dateLine.includes('Domingo')) dayOfWeek = 'DOMINGO';
            }

            const raw = { 'Mediodía': {}, 'Tarde': {}, 'Noche': {} };
            let specialPrizes = null;

            // Group by "Sorteo" blocks to keep results contextual
            let currentBlock = null;
            const blocks = [];
            lines.forEach(l => {
                if (l.toLowerCase().includes('sorteo')) {
                    if (currentBlock) blocks.push(currentBlock);
                    currentBlock = { head: l, lines: [] };
                } else if (currentBlock) currentBlock.lines.push(l);
            });
            if (currentBlock) blocks.push(currentBlock);

            blocks.forEach(b => {
                const head = b.head;
                const text = b.lines.join(' ');
                const sNum = parseInt(head.match(/\d+/)?.[0] || '0');

                // 1. Monazos / Nuevos Tiempos
                if (sNum >= 5000) {
                    draws.forEach(d => {
                        if (text.includes(d)) {
                            const nums = b.lines.filter(l => /^\d{1,2}$/.test(l));
                            if (sNum > 15000 && nums.length >= 1) { // Nuevos Tiempos
                                raw[d].NT = nums[0].padStart(2, '0');
                            } else if (sNum < 15000 && nums.length >= 3) { // 3 Monazos
                                raw[d].M3 = nums.slice(0, 3).map(n => n.trim());
                            }
                        }
                    });
                }

                // 2. Chances / Lotería Nacional
                if (text.includes('1er') && text.includes('LUGAR')) {
                    const tv = [];
                    for (let i = 0; i < b.lines.length; i++) {
                        if (b.lines[i].includes('LUGAR')) {
                            const n = b.lines[i + 1];
                            if (n && /^\d{2}$/.test(n)) tv.push(n);
                        }
                    }
                    if (tv.length >= 3) {
                        const isNational = text.includes('Nacional');
                        const isChances = !isNational;

                        // We take the one with the highest Sorteo number (most recent)
                        if (!specialPrizes || sNum > specialPrizes.sorteo) {
                            specialPrizes = {
                                prizes: tv.slice(0, 3),
                                sorteo: sNum,
                                isNational: isNational,
                                isChances: isChances
                            };
                        }
                    }
                }
            });

            // Standard Draws (Mediodía, Tarde, Noche)
            // Costa Rica is UTC-6 (CST), Panama is UTC-5 (EST)
            // Convert to Panama time by adding 1 hour
            const timeMapping = {
                'Mediodía': '2:55 PM',   // 1:55 PM CR -> 2:55 PM Panama
                'Tarde': '6:30 PM',      // 5:30 PM CR -> 6:30 PM Panama
                'Noche': '9:30 PM'       // 8:30 PM CR -> 9:30 PM Panama
            };

            draws.forEach(d => {
                if (raw[d].NT && raw[d].M3) {
                    finalData.push({
                        time: timeMapping[d],
                        prizes: [raw[d].NT, raw[d].M3[0] + raw[d].M3[1], raw[d].M3[1] + raw[d].M3[2]]
                    });
                }
            });

            // --- 8:30 PM Tica Selection Logic ---
            // Lunes, Miércoles, Jueves, Sábado -> Monazo con Nuevos Tiempos
            // Martes, Viernes -> Chances (1er, 2do, 3er Premio)
            // Domingo -> Lotería Nacional (1er, 2do, 3er Premio)

            const scheduleRule = {
                'LUNES': 'MONAZO',
                'MARTES': 'CHANCES',
                'MIÉRCOLES': 'MONAZO',
                'JUEVES': 'MONAZO',
                'VIERNES': 'CHANCES',
                'SÁBADO': 'MONAZO',
                'DOMINGO': 'NATIONAL'
            };

            const rule = scheduleRule[dayOfWeek] || 'MONAZO';

            if (rule === 'CHANCES' && specialPrizes && specialPrizes.isChances) {
                finalData.push({ time: '9:30 PM', prizes: specialPrizes.prizes });
            } else if (rule === 'NATIONAL' && specialPrizes && specialPrizes.isNational) {
                finalData.push({ time: '9:30 PM', prizes: specialPrizes.prizes });
            } else if (raw.Noche.NT && raw.Noche.M3) {
                // Fallback / Standard: Use the Monazo Noche composite system
                finalData.push({
                    time: '9:30 PM',
                    prizes: [raw.Noche.NT, raw.Noche.M3[0] + raw.Noche.M3[1], raw.Noche.M3[1] + raw.Noche.M3[2]]
                });
            }

            return finalData;
        });

        return results;
    } catch (error) {
        console.error('Error in Costa Rica Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
