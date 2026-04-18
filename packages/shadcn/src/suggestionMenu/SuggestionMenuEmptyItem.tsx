import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'

export const SuggestionMenuEmptyItem = forwardRef<HTMLDivElement, ComponentProps['SuggestionMenu']['EmptyItem']>((props, ref) => {
    const { className, children, ...rest } = props

    assertEmpty(rest)

    return (
        <div
            // Styles from ShadCN DropdownMenuItem component
            className={cn(
                'bn:relative bn:flex bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:px-2 bn:py-1.5 bn:text-sm bn:outline-none bn:transition-colors bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[disabled]:pointer-events-none bn:data-[disabled]:opacity-50',
                className
            )}
            ref={ref}
        >
            <div>{children}</div>
        </div>
    )
})
