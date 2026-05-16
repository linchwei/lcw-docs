export interface WordCountResult {
    charsWithSpaces: number
    charsWithoutSpaces: number
    words: number
    paragraphs: number
    sentences: number
    readingTime: number
    readingTimeText: string
}

export interface SelectionWordCountResult {
    charsWithSpaces: number
    charsWithoutSpaces: number
    words: number
}

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g
const SENTENCE_ENDINGS = /[。！？.!?]+/g

export function calculateWordCount(text: string): WordCountResult {
    if (!text || text.trim().length === 0) {
        return {
            charsWithSpaces: 0,
            charsWithoutSpaces: 0,
            words: 0,
            paragraphs: 0,
            sentences: 0,
            readingTime: 0,
            readingTimeText: '不足1分钟',
        }
    }

    const charsWithSpaces = text.length
    const charsWithoutSpaces = text.replace(/\s/g, '').length

    const chineseChars = (text.match(CHINESE_REGEX) || []).length
    const textWithoutChinese = text.replace(CHINESE_REGEX, ' ')
    const englishWords = textWithoutChinese
        .split(/\s+/)
        .filter(w => w.length > 0 && /[a-zA-Z0-9]/.test(w)).length
    const words = chineseChars + englishWords

    const paragraphs = text
        .split(/\n+/)
        .filter(p => p.trim().length > 0).length

    const sentenceMatches = text.match(SENTENCE_ENDINGS)
    const sentences = sentenceMatches ? sentenceMatches.length : (text.trim().length > 0 ? 1 : 0)

    const chineseReadingTime = chineseChars / 400
    const englishReadingTime = englishWords / 200
    const readingTime = Math.max(chineseReadingTime, englishReadingTime)

    let readingTimeText: string
    if (readingTime < 1) {
        readingTimeText = '不足1分钟'
    } else {
        readingTimeText = `约 ${Math.ceil(readingTime)} 分钟`
    }

    return {
        charsWithSpaces,
        charsWithoutSpaces,
        words,
        paragraphs,
        sentences,
        readingTime,
        readingTimeText,
    }
}

export function calculateSelectionWordCount(text: string): SelectionWordCountResult {
    if (!text || text.trim().length === 0) {
        return { charsWithSpaces: 0, charsWithoutSpaces: 0, words: 0 }
    }

    const charsWithSpaces = text.length
    const charsWithoutSpaces = text.replace(/\s/g, '').length

    const chineseChars = (text.match(CHINESE_REGEX) || []).length
    const textWithoutChinese = text.replace(CHINESE_REGEX, ' ')
    const englishWords = textWithoutChinese
        .split(/\s+/)
        .filter(w => w.length > 0 && /[a-zA-Z0-9]/.test(w)).length
    const words = chineseChars + englishWords

    return { charsWithSpaces, charsWithoutSpaces, words }
}

export function formatNumber(num: number): string {
    return num.toLocaleString()
}
