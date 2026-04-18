import { Dictionary } from '@lcw-doc/core'

import { useLcwDocContext } from '../editor/LcwDocContext'

export function useDictionary(): Dictionary {
    const ctx = useLcwDocContext()
    return ctx!.editor!.dictionary
}
