import { FloatingPortal } from '@floating-ui/react'
import { BlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'
import { FC, useCallback, useMemo, useState } from 'react'

import { useLcwDocEditor } from '../../hooks/useLcwDocEditor'
import { useUIPluginState } from '../../hooks/useUIPluginState'
import { ExtendButton } from './ExtendButton/ExtendButton'
import { ExtendButtonProps } from './ExtendButton/ExtendButtonProps'
import { useExtendButtonsPositioning } from './hooks/useExtendButtonsPositioning'
import { useTableHandlesPositioning } from './hooks/useTableHandlesPositioning'
import { TableHandle } from './TableHandle'
import { TableHandleProps } from './TableHandleProps'

export const TableHandlesController = <
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(props: {
    tableHandle?: FC<TableHandleProps<I, S>>
    extendButton?: FC<ExtendButtonProps<I, S>>
}) => {
    const editor = useLcwDocEditor<BlockSchema, I, S>()

    const [menuContainerRef, setMenuContainerRef] = useState<HTMLDivElement | null>(null)

    if (!editor.tableHandles) {
        throw new Error('TableHandlesController can only be used when LcwDoc editor schema contains table block')
    }

    const callbacks = {
        rowDragStart: editor.tableHandles.rowDragStart,
        colDragStart: editor.tableHandles.colDragStart,
        dragEnd: editor.tableHandles.dragEnd,
        freezeHandles: editor.tableHandles.freezeHandles,
        unfreezeHandles: editor.tableHandles.unfreezeHandles,
    }

    const { freezeHandles, unfreezeHandles } = callbacks

    const onStartExtend = useCallback(() => {
        freezeHandles()
        setHideCol(true)
        setHideRow(true)
    }, [freezeHandles])

    const onEndExtend = useCallback(() => {
        unfreezeHandles()
        setHideCol(false)
        setHideRow(false)
    }, [unfreezeHandles])

    const state = useUIPluginState(editor.tableHandles.onUpdate.bind(editor.tableHandles))

    const draggingState = useMemo(() => {
        return state?.draggingState
            ? {
                  draggedCellOrientation: state?.draggingState?.draggedCellOrientation,
                  mousePos: state?.draggingState?.mousePos,
              }
            : undefined
    }, [state?.draggingState, state?.draggingState?.draggedCellOrientation, state?.draggingState?.mousePos])

    const { rowHandle, colHandle } = useTableHandlesPositioning(
        state?.show || false,
        state?.referencePosCell || null,
        state?.referencePosTable || null,
        draggingState
    )

    const { addOrRemoveColumnsButton, addOrRemoveRowsButton } = useExtendButtonsPositioning(
        state?.showAddOrRemoveColumnsButton || false,
        state?.showAddOrRemoveRowsButton || false,
        state?.referencePosTable || null
    )

    const [hideRow, setHideRow] = useState<boolean>(false)
    const [hideCol, setHideCol] = useState<boolean>(false)

    if (!state) {
        return null
    }

    const TableHandleComponent = props.tableHandle || TableHandle
    const ExtendButtonComponent = props.extendButton || ExtendButton

    return (
        <>
            <div ref={setMenuContainerRef}></div>
            <FloatingPortal root={state.widgetContainer}>
                {!hideRow && menuContainerRef && rowHandle.isMounted && state.rowIndex !== undefined && (
                    <div ref={rowHandle.ref} style={rowHandle.style}>
                        <TableHandleComponent
                            editor={editor as any}
                            orientation={'row'}
                            showOtherSide={() => setHideCol(false)}
                            hideOtherSide={() => setHideCol(true)}
                            index={state.rowIndex}
                            block={state.block}
                            dragStart={callbacks.rowDragStart}
                            dragEnd={callbacks.dragEnd}
                            freezeHandles={callbacks.freezeHandles}
                            unfreezeHandles={callbacks.unfreezeHandles}
                            menuContainer={menuContainerRef}
                        />
                    </div>
                )}
                {!hideCol && menuContainerRef && colHandle.isMounted && state.colIndex !== undefined && (
                    <div ref={colHandle.ref} style={colHandle.style}>
                        <TableHandleComponent
                            editor={editor as any}
                            orientation={'column'}
                            showOtherSide={() => setHideRow(false)}
                            hideOtherSide={() => setHideRow(true)}
                            index={state.colIndex}
                            block={state.block}
                            dragStart={callbacks.colDragStart}
                            dragEnd={callbacks.dragEnd}
                            freezeHandles={callbacks.freezeHandles}
                            unfreezeHandles={callbacks.unfreezeHandles}
                            menuContainer={menuContainerRef}
                        />
                    </div>
                )}

                <div ref={addOrRemoveRowsButton.ref} style={addOrRemoveRowsButton.style}>
                    <ExtendButtonComponent
                        editor={editor as any}
                        orientation={'addOrRemoveRows'}
                        block={state.block}
                        onMouseDown={onStartExtend}
                        onMouseUp={onEndExtend}
                    />
                </div>
                <div ref={addOrRemoveColumnsButton.ref} style={addOrRemoveColumnsButton.style}>
                    <ExtendButtonComponent
                        editor={editor as any}
                        orientation={'addOrRemoveColumns'}
                        block={state.block}
                        onMouseDown={onStartExtend}
                        onMouseUp={onEndExtend}
                    />
                </div>
            </FloatingPortal>
        </>
    )
}
