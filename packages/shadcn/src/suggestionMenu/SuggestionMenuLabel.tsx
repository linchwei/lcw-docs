import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'

export const SuggestionMenuLabel = forwardRef<HTMLDivElement, ComponentProps['SuggestionMenu']['Label']>((props, ref) => {
    const { className, children, ...rest } = props

    assertEmpty(rest)

    return (
        <div
            // Styles from ShadCN DropdownMenuLabel component
            className={cn('bn:px-2 bn:py-1.5 bn:text-sm bn:font-semibold', className)}
            ref={ref}
        >
            {children}
        </div>
    )
})
