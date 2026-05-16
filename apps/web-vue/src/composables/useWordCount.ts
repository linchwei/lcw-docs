import { computed, type Ref } from 'vue'

export function useWordCount(text: Ref<string>) {
    const charCount = computed(() => text.value.length)

    const wordCount = computed(() => {
        const t = text.value.trim()
        if (!t) return 0
        // Count Chinese characters individually, count Western words by whitespace
        const chineseChars = (t.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length
        const westernWords = t
            .replace(/[一-鿿㐀-䶿豈-﫿]/g, ' ')
            .split(/\s+/)
            .filter(Boolean).length
        return chineseChars + westernWords
    })

    return { charCount, wordCount }
}
