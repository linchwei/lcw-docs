import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'

export const SuggestionMenu = forwardRef<HTMLDivElement, ComponentProps['SuggestionMenu']['Root']>((props, ref) => {
    const { className, children, id, ...rest } = props

    assertEmpty(rest)

    return (
        <div
            id={id}
            role="listbox"
            // Styles from ShadCN DropdownMenuContent component
            className={cn(
                'bn:z-50 bn:min-w-[8rem] bn:max-h-[200px] bn:overflow-auto bn:rounded-md bn:border bn:bg-popover bn:p-1 bn:text-popover-foreground bn:shadow-md bn:data-[state=open]:animate-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=open]:fade-in bn:data-[state=closed]:zoom-out bn:data-[state=open]:zoom-in bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
                className
            )}
            ref={ref}
        >
            {children}
        </div>
    )
})
