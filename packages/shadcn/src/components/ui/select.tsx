import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            'bn:flex bn:h-10 bn:w-full bn:items-center bn:justify-between bn:rounded-md bn:border bn:border-input bn:bg-background bn:px-3 bn:py-2 bn:text-sm bn:ring-offset-background bn:placeholder:text-muted-foreground bn:focus:outline-none bn:focus:ring-2 bn:focus:ring-ring bn:focus:ring-offset-2 bn:disabled:cursor-not-allowed bn:disabled:opacity-50 bn:[&>span]:line-clamp-1',
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="bn:h-4 bn:w-4 bn:opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn('bn:flex bn:cursor-default bn:items-center bn:justify-center bn:py-1', className)}
        {...props}
    >
        <ChevronUp className="bn:h-4 bn:w-4" />
    </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn('bn:flex bn:cursor-default bn:items-center bn:justify-center bn:py-1', className)}
        {...props}
    >
        <ChevronDown className="bn:h-4 bn:w-4" />
    </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
    // <SelectPrimitive.Portal>
    <SelectPrimitive.Content
        ref={ref}
        className={cn(
            'bn:relative bn:z-50 bn:max-h-96 bn:min-w-[8rem] bn:overflow-hidden bn:rounded-md bn:border bn:bg-popover bn:text-popover-foreground bn:shadow-md bn:data-[state=open]:animate-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=open]:fade-in bn:data-[state=closed]:zoom-out bn:data-[state=open]:zoom-in bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
            position === 'popper' &&
                'bn:data-[side=bottom]:translate-y-1 bn:data-[side=left]:-translate-x-1 bn:data-[side=right]:translate-x-1 bn:data-[side=top]:-translate-y-1',
            className
        )}
        position={position}
        {...props}
    >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
            className={cn(
                'bn:p-1',
                position === 'popper' && 'bn:h-[var(--radix-select-trigger-height)] bn:w-full bn:min-w-[var(--radix-select-trigger-width)]'
            )}
        >
            {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
    </SelectPrimitive.Content>
    // </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label ref={ref} className={cn('bn:py-1.5 bn:pl-8 bn:pr-2 bn:text-sm bn:font-semibold', className)} {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'bn:relative bn:flex bn:w-full bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:py-1.5 bn:pl-8 bn:pr-2 bn:text-sm bn:outline-none bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[disabled]:pointer-events-none bn:data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <span className="bn:absolute bn:left-2 bn:flex bn:h-3.5 bn:w-3.5 bn:items-center bn:justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="bn:h-4 bn:w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator ref={ref} className={cn('bn:-mx-1 bn:my-1 bn:h-px bn:bg-muted', className)} {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
}
