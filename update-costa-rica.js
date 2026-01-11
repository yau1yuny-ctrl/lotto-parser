import { supabase } from './utils/supabase.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { DateTime } from 'luxon';

async function updateCostaRicaResults() {
    console.log('🇨🇷 Actualizando resultados de Costa Rica en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Eliminar el registro anterior de Costa Rica de hoy
        console.log('🗑️  Eliminando registro anterior de Costa Rica...');
        const { error: deleteError } = await supabase
            .from('lottery_results')
            .delete()
            .eq('country', 'Costa Rica')
            .eq('draw_date', today);

        if (deleteError) {
            console.error('❌ Error eliminando registro anterior:', deleteError);
        } else {
            console.log('✅ Registro anterior eliminado');
        }

        // Scrapear los nuevos resultados
        console.log('\n📍 Scraping Costa Rica...');
        const costaRicaResults = await scrapeCostaRica();

        if (costaRicaResults && costaRicaResults.length > 0) {
            // Eliminar duplicados (el scraper a veces devuelve el sorteo de 9:30 PM dos veces)
            const uniqueResults = [];
            const seen = new Set();

            for (const result of costaRicaResults) {
                const key = `${result.time}-${result.prizes.join(',')}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueResults.push(result);
                }
            }

            console.log(`✅ Obtenidos ${uniqueResults.length} sorteos únicos`);
            console.log('   Datos:', JSON.stringify(uniqueResults, null, 2));

            // Guardar los nuevos resultados
            const { error: insertError } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Costa Rica',
                    draw_name: 'Monazo',
                    draw_date: today,
                    data: uniqueResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (insertError) {
                console.error('❌ Error guardando nuevos resultados:', insertError);
            } else {
                console.log('\n✅ Resultados actualizados exitosamente en Supabase!');
                console.log(`\n📊 Resumen:`);
                uniqueResults.forEach((draw, i) => {
                    console.log(`   ${i + 1}. ${draw.time}: ${draw.prizes.join(', ')}`);
                });
            }
        } else {
            console.log('❌ No se obtuvieron resultados del scraper');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

updateCostaRicaResults();
