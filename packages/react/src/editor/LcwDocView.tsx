// @ts-ignore
import './styles.css'

import { BlockSchema, InlineContentSchema, mergeCSSClasses, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { forwardRef, HTMLAttributes, ReactNode, Ref, useCallback, useEffect, useMemo, useState } from 'react'

import { usePrefersColorScheme } from '../hooks/usePrefersColorScheme'
import { EditorContent } from './EditorContent'
import { ElementRenderer } from './ElementRenderer'
import { LcwDocContext } from './LcwDocContext'
import { LcwDocDefaultUI, LcwDocDefaultUIProps } from './LcwDocDefaultUI'

export type LcwDocViewProps<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> = {
    editor: LcwDocEditor<BSchema, ISchema, SSchema>

    theme?: 'light' | 'dark'
    editable?: boolean
    onSelectionChange?: () => void
    onChange?: () => void
    children?: ReactNode
    ref?: Ref<HTMLDivElement> | undefined // only here to get types working with the generics. Regular form doesn't work
} & Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onSelectionChange' | 'children'> &
    LcwDocDefaultUIProps

function LcwDocViewComponent<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(
    props: LcwDocViewProps<BSchema, ISchema, SSchema>,
    ref: React.Ref<HTMLDivElement>
) {
    const {
        editor,
        className,
        theme,
        children,
        editable,
        onSelectionChange,
        onChange,
        formattingToolbar,
        linkToolbar,
        slashMenu,
        emojiPicker,
        sideMenu,
        filePanel,
        tableHandles,
        ...rest
    } = props

    const prefersColorScheme = usePrefersColorScheme()

    const editorColorScheme = useMemo(() => {
        if (theme) {
            return theme
        }

        return prefersColorScheme
    }, [prefersColorScheme, theme])

    const [contentEditableProps, setContentEditableProps] = useState<Record<string, string>>({})

    useEffect(() => {
        if (editable === undefined) {
            setContentEditableProps({})
            return
        }
        if (editable) {
            setContentEditableProps({ contenteditable: 'true' })
        } else {
            setContentEditableProps({ contenteditable: 'false' })
        }
    }, [editable])

    useEffect(() => {
        if (editable !== undefined) {
            editor.isEditable = editable
        }
    }, [editor, editable])

    useEffect(() => {
        if (!onChange) return
        return editor.onChange(onChange)
    }, [editor, onChange])

    useEffect(() => {
        if (!onSelectionChange) return
        return editor.onSelectionChange(onSelectionChange)
    }, [editor, onSelectionChange])

    const renderChildren = useMemo(() => {
        return (
            <LcwDocDefaultUI
                formattingToolbar={formattingToolbar}
                linkToolbar={linkToolbar}
                slashMenu={slashMenu}
                emojiPicker={emojiPicker}
                sideMenu={sideMenu}
                filePanel={filePanel}
                tableHandles={tableHandles}
            >
                {children}
            </LcwDocDefaultUI>
        )
    }, [formattingToolbar, linkToolbar, slashMenu, emojiPicker, sideMenu, filePanel, tableHandles, children])

    const setElementRenderer = useCallback(
        (elementRenderer: (node: React.ReactNode, container: HTMLElement) => void) => {
            ;(editor as any).elementRenderer = elementRenderer
        },
        [editor]
    )

    const context = useMemo(() => {
        return { editor, setContentEditableProps }
    }, [editor, setContentEditableProps])

    return (
        <LcwDocContext.Provider value={context as any}>
            <ElementRenderer ref={setElementRenderer} />
            {!editor.headless && (
                <EditorContent editor={editor}>
                    <div
                        className={mergeCSSClasses('bn-container', editorColorScheme || '', className || '')}
                        data-color-scheme={editorColorScheme}
                        {...rest}
                        ref={ref}
                    >
                        <div aria-autocomplete="list" aria-haspopup="listbox" ref={editor.mount} {...contentEditableProps} />
                        {renderChildren}
                    </div>
                </EditorContent>
            )}
        </LcwDocContext.Provider>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LcwDocViewRaw: any = forwardRef(LcwDocViewComponent)
