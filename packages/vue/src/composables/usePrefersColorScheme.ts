import { ref, onMounted, onUnmounted } from 'vue'

export const usePrefersColorScheme = () => {
    const preferredColorSchema = ref<'dark' | 'light' | 'no-preference'>('no-preference')

    onMounted(() => {
        const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
        const lightQuery = window.matchMedia?.('(prefers-color-scheme: light)')
        const isDark = darkQuery?.matches
        const isLight = lightQuery?.matches

        preferredColorSchema.value = isDark ? 'dark' : isLight ? 'light' : 'no-preference'

        if (typeof darkQuery?.addEventListener === 'function') {
            const darkListener = ({ matches }: MediaQueryListEvent) => matches && (preferredColorSchema.value = 'dark')
            const lightListener = ({ matches }: MediaQueryListEvent) => matches && (preferredColorSchema.value = 'light')

            darkQuery.addEventListener('change', darkListener)
            lightQuery.addEventListener('change', lightListener)

            onUnmounted(() => {
                darkQuery.removeEventListener('change', darkListener)
                lightQuery.removeEventListener('change', lightListener)
            })
        } else if (darkQuery) {
            const listener = () => {
                preferredColorSchema.value = darkQuery.matches ? 'dark' : lightQuery?.matches ? 'light' : 'no-preference'
            }

            darkQuery.addEventListener('change', listener)
            lightQuery?.addEventListener('change', listener)

            onUnmounted(() => {
                darkQuery.removeEventListener('change', listener)
                lightQuery?.removeEventListener('change', listener)
            })
        }
    })

    return preferredColorSchema
}
