import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import { cn } from '../../lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            'bn:z-50 bn:overflow-hidden bn:rounded-md bn:border bn:bg-popover bn:px-3 bn:py-1.5 bn:text-sm bn:text-popover-foreground bn:shadow-md bn:animate-in bn:fade-in bn:zoom-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=closed]:zoom-out bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
            className
        )}
        {...props}
    />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
