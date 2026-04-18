import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

export const GridSuggestionMenuEmptyItem = forwardRef<HTMLDivElement, ComponentProps['GridSuggestionMenu']['EmptyItem']>((props, ref) => {
    const { className, children, columns, ...rest } = props

    assertEmpty(rest)

    return (
        <div className={className} style={{ gridColumn: `1 / ${columns + 1}` }} ref={ref}>
            {children}
        </div>
    )
})
