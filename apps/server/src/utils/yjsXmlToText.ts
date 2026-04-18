export function yjsXmlToText(xml: string): string {
    if (!xml) return ''
    return xml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
