// Advanced request interception for maximum speed
// Blocks all unnecessary resources beyond what Ghostery blocks

export async function setupAdvancedInterception(page) {
    await page.route('**/*', (route) => {
        const request = route.request();
        const resourceType = request.resourceType();
        const url = request.url();

        // Block these resource types completely
        const blockedTypes = ['stylesheet', 'font', 'image', 'media'];

        // Block these URL patterns
        const blockedPatterns = [
            'analytics',
            'tracking',
            'telemetry',
            'beacon',
            'pixel',
            'tag-manager',
            'gtm',
            'facebook',
            'twitter',
            'linkedin',
            'instagram',
            'youtube',
            'vimeo',
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        // Block if resource type is in blocked list
        if (blockedTypes.includes(resourceType)) {
            return route.abort();
        }

        // Block if URL contains blocked patterns
        if (blockedPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
            return route.abort();
        }

        // Allow everything else
        route.continue();
    });
}
