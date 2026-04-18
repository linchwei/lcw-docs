import { useComponentsContext } from '../../../editor/ComponentsContext'
import { useLcwDocEditor } from '../../../hooks/useLcwDocEditor'

export const UndoButton = () => {
    const Components = useComponentsContext()!
    const editor = useLcwDocEditor()

    return (
        <Components.FormattingToolbar.Button
            className={'bn-button'}
            onClick={() => {
                editor.focus()
                ;(editor._tiptapEditor as any).commands.undo()
            }}
            label={'撤销'}
            mainTooltip={'撤销'}
            secondaryTooltip={'Ctrl+Z'}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            }
        />
    )
}

export const RedoButton = () => {
    const Components = useComponentsContext()!
    const editor = useLcwDocEditor()

    return (
        <Components.FormattingToolbar.Button
            className={'bn-button'}
            onClick={() => {
                editor.focus()
                ;(editor._tiptapEditor as any).commands.redo()
            }}
            label={'重做'}
            mainTooltip={'重做'}
            secondaryTooltip={'Ctrl+Shift+Z'}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
            }
        />
    )
}
