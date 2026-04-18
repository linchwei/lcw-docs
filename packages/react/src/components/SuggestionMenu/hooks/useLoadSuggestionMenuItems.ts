import { useEffect, useRef, useState } from 'react'

export function useLoadSuggestionMenuItems<T>(
    query: string,
    getItems: (query: string) => Promise<T[]>
): {
    items: T[]
    usedQuery: string | undefined
    loadingState: 'loading-initial' | 'loading' | 'loaded'
} {
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(false)

    const currentQuery = useRef<string | undefined>(undefined)
    const usedQuery = useRef<string | undefined>(undefined)

    useEffect(() => {
        const thisQuery = query
        currentQuery.current = query

        setLoading(true)

        getItems(query).then(items => {
            if (currentQuery.current !== thisQuery) {
                return
            }

            setItems(items)
            setLoading(false)
            usedQuery.current = thisQuery
        })
    }, [query, getItems])

    return {
        items: items || [],
        usedQuery: usedQuery.current,
        loadingState: usedQuery.current === undefined ? 'loading-initial' : loading ? 'loading' : 'loaded',
    }
}
