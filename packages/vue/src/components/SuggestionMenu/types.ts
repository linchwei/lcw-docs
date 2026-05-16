import type { DefaultSuggestionItem } from '@lcw-doc/core'
import type { VNode } from 'vue'

export type DefaultVueSuggestionItem = Omit<DefaultSuggestionItem, 'key'> & {
    icon?: VNode | string
}

export type SuggestionMenuProps<T> = {
    items: T[]
    loadingState: 'loading-initial' | 'loading' | 'loaded'
    selectedIndex: number | undefined
    onItemClick?: (item: T) => void
}
