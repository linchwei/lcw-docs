import { flip, offset, size } from '@floating-ui/react'
import { BlockSchema, InlineContentSchema, StyleSchema, SuggestionMenuState } from '@lcw-doc/core'
import { FC, useCallback, useMemo } from 'react'

import { useLcwDocEditor } from '../../../hooks/useLcwDocEditor'
import { useUIElementPositioning } from '../../../hooks/useUIElementPositioning'
import { useUIPluginState } from '../../../hooks/useUIPluginState'
import { getDefaultReactEmojiPickerItems } from './getDefaultReactEmojiPickerItems'
import { GridSuggestionMenu } from './GridSuggestionMenu'
import { GridSuggestionMenuWrapper } from './GridSuggestionMenuWrapper'
import { DefaultReactGridSuggestionItem, GridSuggestionMenuProps } from './types'

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

type ItemType<GetItemsType extends (query: string) => Promise<any[]>> = ArrayElement<Awaited<ReturnType<GetItemsType>>>

export function GridSuggestionMenuController<
    GetItemsType extends (query: string) => Promise<any[]> = (query: string) => Promise<DefaultReactGridSuggestionItem[]>,
>(
    props: {
        triggerCharacter: string
        getItems?: GetItemsType
        columns: number
        minQueryLength?: number
    } & (ItemType<GetItemsType> extends DefaultReactGridSuggestionItem
        ? {
              gridSuggestionMenuComponent?: FC<GridSuggestionMenuProps<ItemType<GetItemsType>>>
              onItemClick?: (item: ItemType<GetItemsType>) => void
          }
        : {
              gridSuggestionMenuComponent: FC<GridSuggestionMenuProps<ItemType<GetItemsType>>>
              onItemClick: (item: ItemType<GetItemsType>) => void
          })
) {
    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const { triggerCharacter, gridSuggestionMenuComponent, columns, minQueryLength, onItemClick, getItems } = props

    const onItemClickOrDefault = useMemo(() => {
        return (
            onItemClick ||
            ((item: ItemType<GetItemsType>) => {
                item.onItemClick(editor)
            })
        )
    }, [editor, onItemClick])

    const getItemsOrDefault = useMemo(() => {
        return getItems || ((async (query: string) => await getDefaultReactEmojiPickerItems(editor, query)) as any as typeof getItems)
    }, [editor, getItems])!

    const callbacks = {
        closeMenu: editor.suggestionMenus.closeMenu,
        clearQuery: editor.suggestionMenus.clearQuery,
    }

    const cb = useCallback(
        (callback: (state: SuggestionMenuState) => void) => {
            return editor.suggestionMenus.onUpdate(triggerCharacter, callback)
        },
        [editor.suggestionMenus, triggerCharacter]
    )

    const state = useUIPluginState(cb)

    const { isMounted, ref, style, getFloatingProps } = useUIElementPositioning(state?.show || false, state?.referencePos || null, 2000, {
        placement: 'bottom-start',
        middleware: [
            offset(10),
            flip(),
            size({
                apply({ availableHeight, elements }) {
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight - 10}px`,
                    })
                },
            }),
        ],
        onOpenChange(open) {
            if (!open) {
                editor.suggestionMenus.closeMenu()
            }
        },
    })

    if (
        !isMounted ||
        !state ||
        (!state?.ignoreQueryLength && minQueryLength && (state.query.startsWith(' ') || state.query.length < minQueryLength))
    ) {
        return null
    }

    return (
        <div ref={ref} style={style} {...getFloatingProps()}>
            <GridSuggestionMenuWrapper
                query={state.query}
                closeMenu={callbacks.closeMenu}
                clearQuery={callbacks.clearQuery}
                getItems={getItemsOrDefault}
                columns={columns}
                gridSuggestionMenuComponent={(gridSuggestionMenuComponent || GridSuggestionMenu) as any}
                onItemClick={onItemClickOrDefault}
            />
        </div>
    )
}
