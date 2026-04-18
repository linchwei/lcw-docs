import type { LcwDocEditor } from '@lcw-doc/core'

import { useEditorChange } from './useEditorChange'
import { useEditorSelectionChange } from './useEditorSelectionChange'

export function useEditorContentOrSelectionChange(callback: () => void, editor?: LcwDocEditor<any, any, any>) {
    useEditorChange(callback, editor)
    useEditorSelectionChange(callback, editor)
}
