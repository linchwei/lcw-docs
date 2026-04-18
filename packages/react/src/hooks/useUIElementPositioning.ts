import { useDismiss, useFloating, UseFloatingOptions, useInteractions, useTransitionStyles } from '@floating-ui/react'
import { useEffect, useMemo } from 'react'

export function useUIElementPositioning(
    show: boolean,
    referencePos: DOMRect | null,
    zIndex: number,
    options?: Partial<UseFloatingOptions>
) {
    const { refs, update, context, floatingStyles } = useFloating({
        open: show,
        ...options,
    })

    const { isMounted, styles } = useTransitionStyles(context)
    const dismiss = useDismiss(context)
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss])

    useEffect(() => {
        update()
    }, [referencePos, update])

    useEffect(() => {
        if (referencePos === null) {
            return
        }

        refs.setReference({
            getBoundingClientRect: () => referencePos,
        })
    }, [referencePos, refs])

    return useMemo(
        () => ({
            isMounted,
            ref: refs.setFloating,
            style: {
                display: 'flex',
                ...styles,
                ...floatingStyles,
                zIndex: zIndex,
            },
            getFloatingProps,
            getReferenceProps,
        }),
        [floatingStyles, isMounted, refs.setFloating, styles, zIndex, getFloatingProps, getReferenceProps]
    )
}
