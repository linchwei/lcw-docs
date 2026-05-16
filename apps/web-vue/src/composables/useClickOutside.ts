import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const DEFAULT_EVENTS = ['mousedown', 'touchstart']

export function useClickOutside<T extends HTMLElement = any>(
    handler: () => void,
    events?: string[] | null,
    nodes?: Ref<(HTMLElement | null)[]>,
) {
    const targetRef = ref<T | null>(null)

    const listener = (event: any) => {
        const target = event?.target
        if (!target) return

        if (nodes?.value) {
            const shouldIgnore =
                target?.hasAttribute('data-ignore-outside-clicks') ||
                (!document.body.contains(target) && target.tagName !== 'HTML')
            const shouldTrigger = nodes.value.every(node => !!node && !event.composedPath().includes(node))
            if (shouldTrigger && !shouldIgnore) {
                handler()
            }
        } else if (targetRef.value && !targetRef.value.contains(target)) {
            handler()
        }
    }

    onMounted(() => {
        ;(events || DEFAULT_EVENTS).forEach(fn => document.addEventListener(fn, listener))
    })

    onBeforeUnmount(() => {
        ;(events || DEFAULT_EVENTS).forEach(fn => document.removeEventListener(fn, listener))
    })

    return targetRef
}
