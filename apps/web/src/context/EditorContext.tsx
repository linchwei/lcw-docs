import { LcwDocEditor } from '@lcw-doc/core'
import { createContext, useContext, useState, ReactNode } from 'react'

interface EditorContextType {
    editor: LcwDocEditor<any, any, any> | null
    setEditor: (editor: LcwDocEditor<any, any, any> | null) => void
}

const EditorContext = createContext<EditorContextType>({
    editor: null,
    setEditor: () => {},
})

export function EditorProvider({ children }: { children: ReactNode }) {
    const [editor, setEditor] = useState<LcwDocEditor<any, any, any> | null>(null)

    return (
        <EditorContext.Provider value={{ editor, setEditor }}>
            {children}
        </EditorContext.Provider>
    )
}

export function useEditorContext() {
    return useContext(EditorContext)
}
