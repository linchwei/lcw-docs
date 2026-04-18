export function sanitizeUrl(inputUrl: string, baseUrl: string): string {
    try {
        const url = new URL(inputUrl, baseUrl)

        if (url.protocol !== 'javascript:') {
            return url.href
        }
    } catch {
        // if URL creation fails, it's an invalid URL
    }
    return '#'
}
