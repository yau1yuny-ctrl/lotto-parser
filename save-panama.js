import { supabase } from './utils/supabase.js';
import { scrapePanama } from './scrapers/panama.js';
import { DateTime } from 'luxon';

async function savePanamaResults() {
    console.log('🇵🇦 Guardando resultados de Panamá en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Scrapear resultados de Panamá
        console.log('📍 Scraping Lotería Nacional de Panamá...');
        const panamaResults = await scrapePanama();

        if (panamaResults && panamaResults.length > 0) {
            console.log(`✅ Obtenidos ${panamaResults.length} sorteos`);

            // Guardar en Supabase
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Panama',
                    draw_name: 'Loteria Nacional',
                    draw_date: today,
                    data: panamaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando:', error);
            } else {
                console.log('\n✅ Resultados guardados en Supabase!');
                console.log('\n📊 Resumen:');
                panamaResults.forEach((sorteo, i) => {
                    console.log(`\n   ${i + 1}. ${sorteo.title}`);
                    sorteo.prizes.forEach(prize => {
                        console.log(`      ${prize.label}: ${prize.number}`);
                    });
                });

                console.log('\n\n--- ESTRUCTURA JSON ---');
                console.log(JSON.stringify(panamaResults, null, 2));
            }
        } else {
            console.log('❌ No se obtuvieron resultados');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

savePanamaResults();
