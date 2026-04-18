import * as React from 'react'

import { cn } from '../../lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                'bn:flex bn:h-10 bn:w-full bn:rounded-md bn:border bn:border-input bn:bg-background bn:px-3 bn:py-2 bn:text-sm bn:ring-offset-background bn:file:border-0 bn:file:bg-transparent bn:file:text-sm bn:file:font-medium bn:placeholder:text-muted-foreground bn:focus-visible:outline-none bn:focus-visible:ring-2 bn:focus-visible:ring-ring bn:focus-visible:ring-offset-2 bn:disabled:cursor-not-allowed bn:disabled:opacity-50',
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = 'Input'

export { Input }
