import { ref, onMounted, onUnmounted } from 'vue'

export function useUIPluginState<State>(onUpdate: (callback: (state: State) => void) => (() => void)) {
    const state = ref<State>()

    let cleanup: (() => void) | undefined

    onMounted(() => {
        cleanup = onUpdate(s => {
            state.value = { ...(s as any) } as State
        })
    })

    onUnmounted(() => {
        cleanup?.()
    })

    return state
}
