import { useEffect, useMemo, useState } from 'react'

export const usePrefersColorScheme = () => {
    const darkQuery = useMemo(() => window.matchMedia?.('(prefers-color-scheme: dark)'), [])
    const lightQuery = useMemo(() => window.matchMedia?.('(prefers-color-scheme: light)'), [])
    const isDark = darkQuery?.matches
    const isLight = lightQuery?.matches

    const [preferredColorSchema, setPreferredColorSchema] = useState<'dark' | 'light' | 'no-preference'>(
        isDark ? 'dark' : isLight ? 'light' : 'no-preference'
    )

    useEffect(() => {
        if (isDark) {
            setPreferredColorSchema('dark')
        } else if (isLight) {
            setPreferredColorSchema('light')
        } else {
            setPreferredColorSchema('no-preference')
        }
    }, [isDark, isLight])

    useEffect(() => {
        if (typeof darkQuery?.addEventListener === 'function') {
            const darkListener = ({ matches }: MediaQueryListEvent) => matches && setPreferredColorSchema('dark')
            const lightListener = ({ matches }: MediaQueryListEvent) => matches && setPreferredColorSchema('light')

            darkQuery?.addEventListener('change', darkListener)
            lightQuery?.addEventListener('change', lightListener)

            return () => {
                darkQuery?.removeEventListener('change', darkListener)
                lightQuery?.removeEventListener('change', lightListener)
            }
        } else {
            const listener = () => setPreferredColorSchema(darkQuery.matches ? 'dark' : lightQuery.matches ? 'light' : 'no-preference')

            darkQuery?.addEventListener('change', listener)
            lightQuery?.addEventListener('change', listener)

            return () => {
                darkQuery?.removeEventListener('change', listener)
                lightQuery?.removeEventListener('change', listener)
            }
        }
    }, [darkQuery, lightQuery])

    if (typeof window.matchMedia !== 'function') {
        return preferredColorSchema
    }

    return preferredColorSchema
}
