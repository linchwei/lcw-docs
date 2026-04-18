import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'
import { useShadCNComponentsContext } from '../ShadCNComponentsContext'

export const TableHandle = forwardRef<HTMLButtonElement, ComponentProps['TableHandle']['Root']>((props, ref) => {
    const { className, children, draggable, onDragStart, onDragEnd, style, label, ...rest } = props

    assertEmpty(rest, false)

    const ShadCNComponents = useShadCNComponentsContext()!

    return (
        <ShadCNComponents.Button.Button
            variant={'ghost'}
            className={cn(className, 'bn:p-0 bn:h-fit bn:w-fit bn:text-gray-400')}
            ref={ref}
            aria-label={label}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            style={style}
            {...rest}
        >
            {children}
        </ShadCNComponents.Button.Button>
    )
})
