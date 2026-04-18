import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: boolean
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            'bn:flex bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:px-2 bn:py-1.5 bn:text-sm bn:outline-none bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[state=open]:bg-accent',
            inset && 'bn:pl-8',
            className
        )}
        {...props}
    >
        {children}
        <ChevronRight className="bn:ml-auto bn:h-4 bn:w-4" />
    </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            'bn:z-50 bn:min-w-[8rem] bn:overflow-hidden bn:rounded-md bn:border bn:bg-popover bn:p-1 bn:text-popover-foreground bn:shadow-lg bn:data-[state=open]:animate-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=open]:fade-in bn:data-[state=closed]:zoom-out bn:data-[state=open]:zoom-in bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
            className
        )}
        {...props}
    />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            'bn:z-50 bn:min-w-[8rem] bn:overflow-hidden bn:rounded-md bn:border bn:bg-popover bn:p-1 bn:text-popover-foreground bn:shadow-md bn:data-[state=open]:animate-in bn:data-[state=closed]:animate-out bn:data-[state=closed]:fade-out bn:data-[state=open]:fade-in bn:data-[state=closed]:zoom-out bn:data-[state=open]:zoom-in bn:data-[side=bottom]:slide-in-from-top bn:data-[side=left]:slide-in-from-right bn:data-[side=right]:slide-in-from-left bn:data-[side=top]:slide-in-from-bottom',
            className
        )}
        {...props}
    />
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        inset?: boolean
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            'bn:relative bn:flex bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:px-2 bn:py-1.5 bn:text-sm bn:outline-none bn:transition-colors bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[disabled]:pointer-events-none bn:data-[disabled]:opacity-50',
            inset && 'bn:pl-8',
            className
        )}
        {...props}
    />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            'bn:relative bn:flex bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:py-1.5 bn:pl-8 bn:pr-2 bn:text-sm bn:outline-none bn:transition-colors bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[disabled]:pointer-events-none bn:data-[disabled]:opacity-50',
            className
        )}
        checked={checked}
        {...props}
    >
        <span className="bn:absolute bn:left-2 bn:flex bn:h-3.5 bn:w-3.5 bn:items-center bn:justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Check className="bn:h-4 bn:w-4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            'bn:relative bn:flex bn:cursor-default bn:select-none bn:items-center bn:rounded-sm bn:py-1.5 bn:pl-8 bn:pr-2 bn:text-sm bn:outline-none bn:transition-colors bn:focus:bg-accent bn:focus:text-accent-foreground bn:data-[disabled]:pointer-events-none bn:data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <span className="bn:absolute bn:left-2 bn:flex bn:h-3.5 bn:w-3.5 bn:items-center bn:justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Circle className="bn:h-2 bn:w-2 bn:fill-current" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: boolean
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn('bn:px-2 bn:py-1.5 bn:text-sm bn:font-semibold', inset && 'bn:pl-8', className)}
        {...props}
    />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn('bn:-mx-1 bn:my-1 bn:h-px bn:bg-muted', className)} {...props} />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
    return <span className={cn('bn:ml-auto bn:text-xs bn:tracking-widest bn:opacity-60', className)} {...props} />
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
}
