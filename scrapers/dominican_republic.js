import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeDominicanRepublic() {
    try {
        const response = await axios.get('https://laprimera.do/');
        const $ = cheerio.load(response.data);

        const results = [];
        $('.draw-result').each(function (i, el) {
            const name = $(el).find('.draw-name').text().trim();
            const numbers = $(el).find('.winning-number').map(function (j, n) { return $(n).text().trim(); }).get();
            if (name && numbers.length > 0) {
                results.push({ name: name, numbers: numbers });
            }
        });

        return results;
    } catch (error) {
        console.error('Error scraping DR:', error);
        return null;
    }
}
