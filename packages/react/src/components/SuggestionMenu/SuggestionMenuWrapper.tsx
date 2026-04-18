import { BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'
import { FC, useCallback, useEffect } from 'react'

import { useLcwDocContext } from '../../editor/LcwDocContext'
import { useLcwDocEditor } from '../../hooks/useLcwDocEditor'
import { useCloseSuggestionMenuNoItems } from './hooks/useCloseSuggestionMenuNoItems'
import { useLoadSuggestionMenuItems } from './hooks/useLoadSuggestionMenuItems'
import { useSuggestionMenuKeyboardNavigation } from './hooks/useSuggestionMenuKeyboardNavigation'
import { SuggestionMenuProps } from './types'

export function SuggestionMenuWrapper<Item>(props: {
    query: string
    closeMenu: () => void
    clearQuery: () => void
    getItems: (query: string) => Promise<Item[]>
    onItemClick?: (item: Item) => void
    suggestionMenuComponent: FC<SuggestionMenuProps<Item>>
}) {
    const ctx = useLcwDocContext()
    const setContentEditableProps = ctx!.setContentEditableProps!
    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const { getItems, suggestionMenuComponent, query, clearQuery, closeMenu, onItemClick } = props

    const onItemClickCloseMenu = useCallback(
        (item: Item) => {
            closeMenu()
            clearQuery()
            onItemClick?.(item)
        },
        [onItemClick, closeMenu, clearQuery]
    )

    const { items, usedQuery, loadingState } = useLoadSuggestionMenuItems(query, getItems)

    useCloseSuggestionMenuNoItems(items, usedQuery, closeMenu)

    const { selectedIndex } = useSuggestionMenuKeyboardNavigation(editor, query, items, onItemClickCloseMenu)

    useEffect(() => {
        setContentEditableProps(p => ({
            ...p,
            'aria-expanded': true,
            'aria-controls': 'bn-suggestion-menu',
        }))
        return () => {
            setContentEditableProps(p => ({
                ...p,
                'aria-expanded': false,
                'aria-controls': undefined,
            }))
        }
    }, [setContentEditableProps])

    useEffect(() => {
        setContentEditableProps(p => ({
            ...p,
            'aria-activedescendant': selectedIndex ? 'bn-suggestion-menu-item-' + selectedIndex : undefined,
        }))
        return () => {
            setContentEditableProps(p => ({
                ...p,
                'aria-activedescendant': undefined,
            }))
        }
    }, [setContentEditableProps, selectedIndex])

    const Component = suggestionMenuComponent

    return <Component items={items} onItemClick={onItemClickCloseMenu} loadingState={loadingState} selectedIndex={selectedIndex} />
}
