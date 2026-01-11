import { supabase } from './utils/supabase.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { DateTime } from 'luxon';

async function updateHondurasResults() {
    console.log('🇭🇳 Actualizando resultados de Honduras en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Eliminar el registro anterior de Honduras de hoy
        console.log('🗑️  Eliminando registro anterior de Honduras...');
        const { error: deleteError } = await supabase
            .from('lottery_results')
            .delete()
            .eq('country', 'Honduras')
            .eq('draw_date', today);

        if (deleteError) {
            console.error('❌ Error eliminando registro anterior:', deleteError);
        } else {
            console.log('✅ Registro anterior eliminado');
        }

        // Scrapear los nuevos resultados
        console.log('\n📍 Scraping Honduras...');
        const hondurasResults = await scrapeHonduras();

        if (hondurasResults && hondurasResults.length > 0) {
            console.log(`✅ Obtenidos ${hondurasResults.length} sorteos`);
            console.log('   Datos:', JSON.stringify(hondurasResults, null, 2));

            // Guardar los nuevos resultados
            const { error: insertError } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Honduras',
                    draw_name: 'Honduras',
                    draw_date: today,
                    data: hondurasResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (insertError) {
                console.error('❌ Error guardando nuevos resultados:', insertError);
            } else {
                console.log('\n✅ Resultados actualizados exitosamente en Supabase!');
                console.log(`\n📊 Resumen:`);
                hondurasResults.forEach((draw, i) => {
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

updateHondurasResults();
