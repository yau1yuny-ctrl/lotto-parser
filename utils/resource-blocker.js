import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import fetch from 'cross-fetch';

// Cache the blocker instance to avoid fetching lists multiple times
let blockerInstance = null;

// Helper function to enable Ghostery adblocker on a page
// This blocks ads, trackers, and unnecessary resources using professional blocklists
export async function enableAdBlocker(page) {
    try {
        if (!blockerInstance) {
            console.log('Initializing Ghostery adblocker...');
            blockerInstance = await PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch);
        }

        await blockerInstance.enableBlockingInPage(page);
        console.log('Adblocker enabled');
    } catch (error) {
        console.warn('Failed to enable adblocker:', error.message);
        // Continue without adblocker if it fails
    }
}
