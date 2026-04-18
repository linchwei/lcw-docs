import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'
import { useShadCNComponentsContext } from '../ShadCNComponentsContext'

export const PanelTextInput = forwardRef<HTMLInputElement, ComponentProps['FilePanel']['TextInput']>((props, ref) => {
    const { className, value, placeholder, onKeyDown, onChange, ...rest } = props

    assertEmpty(rest)

    const ShadCNComponents = useShadCNComponentsContext()!

    return (
        <ShadCNComponents.Input.Input
            data-test={'embed-input'}
            className={cn(className, 'bn:w-80')}
            ref={ref}
            value={value}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            onChange={onChange}
        />
    )
})
