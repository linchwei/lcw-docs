import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'

import { cn } from '../../lib/utils'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
            'bn:z-50 bn:w-72 bn:rounded-md bn:border bn:bg-popover bn:p-4 bn:text-popover-foreground bn:shadow-md bn:outline-none bn:data-[state=open]:animate-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=open]:fade-in bn:data-[state=closed]:zoom-out bn:data-[state=open]:zoom-in bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
            className
        )}
        {...props}
    />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverContent, PopoverTrigger }
