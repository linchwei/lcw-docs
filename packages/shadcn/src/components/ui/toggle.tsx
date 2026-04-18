import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

const toggleVariants = cva(
    'bn:inline-flex bn:items-center bn:justify-center bn:rounded-md bn:text-sm bn:font-medium bn:ring-offset-background bn:transition-colors bn:hover:bg-muted bn:hover:text-muted-foreground bn:focus-visible:outline-none bn:focus-visible:ring-2 bn:focus-visible:ring-ring bn:focus-visible:ring-offset-2 bn:disabled:pointer-events-none bn:disabled:opacity-50 bn:data-[state=on]:bg-accent bn:data-[state=on]:text-accent-foreground',
    {
        variants: {
            variant: {
                default: 'bn:bg-transparent',
                outline: 'bn:border bn:border-input bn:bg-transparent bn:hover:bg-accent bn:hover:text-accent-foreground',
            },
            size: {
                default: 'bn:h-10 bn:px-3',
                sm: 'bn:h-9 bn:px-2.5',
                lg: 'bn:h-11 bn:px-5',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

const Toggle = React.forwardRef<
    React.ElementRef<typeof TogglePrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
