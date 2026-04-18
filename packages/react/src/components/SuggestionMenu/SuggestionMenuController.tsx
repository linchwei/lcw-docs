import { flip, offset, shift, size } from '@floating-ui/react'
import { BlockSchema, filterSuggestionItems, InlineContentSchema, StyleSchema, SuggestionMenuState } from '@lcw-doc/core'
import { FC, useCallback, useMemo } from 'react'

import { useLcwDocEditor } from '../../hooks/useLcwDocEditor'
import { useUIElementPositioning } from '../../hooks/useUIElementPositioning'
import { useUIPluginState } from '../../hooks/useUIPluginState'
import { getDefaultReactSlashMenuItems } from './getDefaultReactSlashMenuItems'
import { SuggestionMenu } from './SuggestionMenu'
import { SuggestionMenuWrapper } from './SuggestionMenuWrapper'
import { DefaultReactSuggestionItem, SuggestionMenuProps } from './types'

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

type ItemType<GetItemsType extends (query: string) => Promise<any[]>> = ArrayElement<Awaited<ReturnType<GetItemsType>>>

export function SuggestionMenuController<
    GetItemsType extends (query: string) => Promise<any[]> = (query: string) => Promise<DefaultReactSuggestionItem[]>,
>(
    props: {
        triggerCharacter: string
        getItems?: GetItemsType
        minQueryLength?: number
    } & (ItemType<GetItemsType> extends DefaultReactSuggestionItem
        ? {
              suggestionMenuComponent?: FC<SuggestionMenuProps<ItemType<GetItemsType>>>
              onItemClick?: (item: ItemType<GetItemsType>) => void
          }
        : {
              suggestionMenuComponent: FC<SuggestionMenuProps<ItemType<GetItemsType>>>
              onItemClick: (item: ItemType<GetItemsType>) => void
          })
) {
    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const { triggerCharacter, suggestionMenuComponent, minQueryLength, onItemClick, getItems } = props

    const onItemClickOrDefault = useMemo(() => {
        return (
            onItemClick ||
            ((item: ItemType<GetItemsType>) => {
                item.onItemClick(editor)
            })
        )
    }, [editor, onItemClick])

    const getItemsOrDefault = useMemo(() => {
        return (
            getItems ||
            ((async (query: string) => filterSuggestionItems(getDefaultReactSlashMenuItems(editor), query)) as any as typeof getItems)
        )
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
            flip({
                mainAxis: true,
                crossAxis: false,
            }),
            shift(),
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
            <SuggestionMenuWrapper
                query={state.query}
                closeMenu={callbacks.closeMenu}
                clearQuery={callbacks.clearQuery}
                getItems={getItemsOrDefault}
                suggestionMenuComponent={(suggestionMenuComponent || SuggestionMenu) as any}
                onItemClick={onItemClickOrDefault}
            />
        </div>
    )
}
