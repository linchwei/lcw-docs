import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '../../lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.List
            ref={ref}
            className={cn(
                'bn:inline-flex bn:h-10 bn:items-center bn:justify-center bn:rounded-md bn:bg-muted bn:p-1 bn:text-muted-foreground',
                className
            )}
            {...props}
        />
    )
)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            'bn:inline-flex bn:items-center bn:justify-center bn:whitespace-nowrap bn:rounded-sm bn:px-3 bn:py-1.5 bn:text-sm bn:font-medium bn:ring-offset-background bn:transition-all bn:focus-visible:outline-none bn:focus-visible:ring-2 bn:focus-visible:ring-ring bn:focus-visible:ring-offset-2 bn:disabled:pointer-events-none bn:disabled:opacity-50 bn:data-[state=active]:bg-background bn:data-[state=active]:text-foreground bn:data-[state=active]:shadow-sm',
            className
        )}
        {...props}
    />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            'bn:mt-2 bn:ring-offset-background bn:focus-visible:outline-none bn:focus-visible:ring-2 bn:focus-visible:ring-ring bn:focus-visible:ring-offset-2',
            className
        )}
        {...props}
    />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
