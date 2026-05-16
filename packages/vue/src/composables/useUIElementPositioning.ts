import { ref, computed, watch, isRef, type Ref } from 'vue'
import { useFloating, offset, flip, shift, autoUpdate, type UseFloatingOptions, type ReferenceElement } from '@floating-ui/vue'

export function useUIElementPositioning(
    show: Ref<boolean> | boolean,
    referencePos: Ref<DOMRect | null> | DOMRect | null,
    zIndex: number,
    options?: Partial<UseFloatingOptions>
) {
    const referenceRef = ref<ReferenceElement | null>(null)
    const floatingRef = ref<HTMLElement | null>(null)
    const isMounted = ref(false)

    const showRef = isRef(show) ? show : ref(show)
    const referencePosRef = isRef(referencePos) ? referencePos : ref(referencePos)

    const { x, y, strategy, placement, update } = useFloating(referenceRef, floatingRef, {
        open: showRef,
        middleware: [offset(4), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
        ...options,
    })

    watch(showRef, (val) => {
        isMounted.value = val
    }, { immediate: true })

    watch(referencePosRef, (pos) => {
        if (pos) {
            referenceRef.value = {
                getBoundingClientRect: () => pos,
                contextElement: undefined,
            } as ReferenceElement
            update()
        } else {
            referenceRef.value = null
        }
    }, { immediate: true, deep: true })

    const style = computed(() => ({
        position: strategy.value,
        top: '0',
        left: '0',
        transform: `translate3d(${Math.round(x.value)}px, ${Math.round(y.value)}px, 0)`,
        zIndex,
        display: 'flex',
    }))

    return {
        isMounted,
        ref: floatingRef,
        style,
        placement,
        getFloatingProps: () => ({}),
        getReferenceProps: () => ({}),
    }
}
