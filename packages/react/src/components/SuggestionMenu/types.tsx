import { DefaultSuggestionItem } from '@lcw-doc/core'
import { ReactElement } from 'react'

export type DefaultReactSuggestionItem = Omit<DefaultSuggestionItem, 'key'> & {
    icon?: ReactElement
}

export type SuggestionMenuProps<T> = {
    items: T[]
    loadingState: 'loading-initial' | 'loading' | 'loaded'
    selectedIndex: number | undefined
    onItemClick?: (item: T) => void
}
