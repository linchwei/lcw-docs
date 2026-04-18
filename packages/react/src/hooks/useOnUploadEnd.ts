import { useEffect } from 'react'

import { useLcwDocEditor } from './useLcwDocEditor'

export function useOnUploadEnd(callback: (blockId?: string) => void) {
    const editor = useLcwDocEditor()

    useEffect(() => {
        return editor.onUploadEnd(callback)
    }, [callback, editor])
}
