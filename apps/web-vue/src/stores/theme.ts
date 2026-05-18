import { darkTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<'light' | 'dark' | 'system'>((localStorage.getItem('lcwdoc-theme') as 'light' | 'dark' | 'system') || 'light')

    const isDark = computed(() => {
        if (theme.value === 'dark') return true
        if (theme.value === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
    })

    const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

    function setTheme(t: 'light' | 'dark' | 'system') {
        theme.value = t
        localStorage.setItem('lcwdoc-theme', t)
        document.documentElement.classList.toggle('dark', isDark.value)
    }

    function applyInitialTheme() {
        document.documentElement.classList.toggle('dark', isDark.value)
    }

    return { theme, isDark, naiveTheme, setTheme, applyInitialTheme }
})
