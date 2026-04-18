import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'
import { useShadCNComponentsContext } from '../ShadCNComponentsContext'

export const SideMenuButton = forwardRef<HTMLButtonElement, ComponentProps['SideMenu']['Button']>((props, ref) => {
    const { className, children, icon, onClick, onDragEnd, onDragStart, draggable, label, ...rest } = props

    assertEmpty(rest, false)

    const ShadCNComponents = useShadCNComponentsContext()!

    return (
        <ShadCNComponents.Button.Button
            variant={'ghost'}
            className={cn(className, 'bn:text-gray-400')}
            ref={ref}
            aria-label={label}
            onClick={onClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            draggable={draggable}
            {...rest}
        >
            {icon}
            {children}
        </ShadCNComponents.Button.Button>
    )
})
