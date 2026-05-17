import { useDismiss, useFloating, UseFloatingOptions, useInteractions, useTransitionStyles } from '@floating-ui/react'
import { useEffect } from 'react'

export function useUIElementPositioning(
    show: boolean,
    referencePos: DOMRect | null,
    zIndex: number,
    options?: Partial<UseFloatingOptions> & { isDragging?: boolean }
) {
    const isDragging = options?.isDragging ?? false

    const { refs, update, context, floatingStyles } = useFloating({
        open: show,
        ...options,
    })

    const { isMounted, styles } = useTransitionStyles(context)
    const dismiss = useDismiss(context, {
        outsidePress: !isDragging,
        escapeKey: !isDragging,
    })
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

    return {
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
    }
}
