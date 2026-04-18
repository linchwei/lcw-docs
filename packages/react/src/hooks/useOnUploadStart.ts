import { useEffect } from 'react'

import { useLcwDocEditor } from './useLcwDocEditor'

export function useOnUploadStart(callback: (blockId?: string) => void) {
    const editor = useLcwDocEditor()

    useEffect(() => {
        return editor.onUploadStart(callback)
    }, [callback, editor])
}
