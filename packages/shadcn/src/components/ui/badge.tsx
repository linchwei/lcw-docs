import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

const badgeVariants = cva(
    'bn:inline-flex bn:items-center bn:rounded-full bn:border bn:px-2.5 bn:py-0.5 bn:text-xs bn:font-semibold bn:transition-colors bn:focus:outline-none bn:focus:ring-2 bn:focus:ring-ring bn:focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'bn:border-transparent bn:bg-primary bn:text-primary-foreground bn:hover:bg-primary/80',
                secondary: 'bn:border-transparent bn:bg-secondary bn:text-secondary-foreground bn:hover:bg-secondary/80',
                destructive: 'bn:border-transparent bn:bg-destructive bn:text-destructive-foreground bn:hover:bg-destructive/80',
                outline: 'bn:text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
