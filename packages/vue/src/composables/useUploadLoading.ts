import { ref } from 'vue'

import { useOnUploadEnd } from './useOnUploadEnd'
import { useOnUploadStart } from './useOnUploadStart'

export function useUploadLoading(blockId?: string) {
    const showLoader = ref(false)

    useOnUploadStart(uploadBlockId => {
        if (uploadBlockId === blockId) {
            showLoader.value = true
        }
    })

    useOnUploadEnd(uploadBlockId => {
        if (uploadBlockId === blockId) {
            showLoader.value = false
        }
    })

    return showLoader
}
