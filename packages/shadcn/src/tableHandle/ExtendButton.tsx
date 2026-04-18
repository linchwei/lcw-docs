import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'
import { useShadCNComponentsContext } from '../ShadCNComponentsContext'

export const ExtendButton = forwardRef<HTMLButtonElement, ComponentProps['TableHandle']['ExtendButton']>((props, ref) => {
    const { className, children, onMouseDown, onClick, ...rest } = props

    assertEmpty(rest, false)

    const ShadCNComponents = useShadCNComponentsContext()!

    return (
        <ShadCNComponents.Button.Button
            variant={'ghost'}
            className={cn(
                className,
                'bn:p-0 bn:h-full bn:w-full bn:text-gray-400',
                className?.includes('bn:extend-button-add-remove-columns') ? 'bn:ml-1' : 'bn:mt-1',
                className?.includes('bn:extend-button-editing') ? 'bn:bg-accent bn:text-accent-foreground' : ''
            )}
            ref={ref}
            onClick={onClick}
            onMouseDown={onMouseDown}
            {...rest}
        >
            {children}
        </ShadCNComponents.Button.Button>
    )
})
