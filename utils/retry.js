// Improved retry logic with exponential backoff

export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

// Retry specifically for page navigation with custom timeouts
export async function retryNavigation(page, url, options = {}) {
    return retryWithBackoff(async () => {
        return await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
            ...options
        });
    }, 3, 2000);
}
