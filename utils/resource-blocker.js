// Helper function to block unnecessary resources (ads, trackers, images, etc.)
// This speeds up page loading significantly
export async function blockUnnecessaryResources(page) {
    await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        const url = route.request().url();

        // Block ads, trackers, images, fonts, media
        if (resourceType === 'image' ||
            resourceType === 'font' ||
            resourceType === 'media' ||
            url.includes('google-analytics') ||
            url.includes('googletagmanager') ||
            url.includes('facebook') ||
            url.includes('doubleclick') ||
            url.includes('ads') ||
            url.includes('adservice') ||
            url.includes('tracking')) {
            route.abort();
        } else {
            route.continue();
        }
    });
}
