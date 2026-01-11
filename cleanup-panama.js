import { supabase } from './utils/supabase.js';
import { DateTime } from 'luxon';

async function cleanupPanamaTestData() {
    console.log('🗑️  Eliminando datos de prueba de Panamá...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Eliminar el registro de Panamá de hoy (que tenía fechas incorrectas)
        const { error } = await supabase
            .from('lottery_results')
            .delete()
            .eq('country', 'Panama')
            .eq('draw_date', today);

        if (error) {
            console.error('❌ Error eliminando:', error);
        } else {
            console.log('✅ Registro de prueba de Panamá eliminado');
            console.log('\n📝 Nota: El scraper de Panamá ahora solo guardará resultados');
            console.log('   cuando haya sorteos del día actual en el sitio web.');
            console.log('\n   Hoy (10 de Enero) no hay sorteos de Lotería Nacional,');
            console.log('   por lo que no hay datos que guardar.');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

cleanupPanamaTestData();
