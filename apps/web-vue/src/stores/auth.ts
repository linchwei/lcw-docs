import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const user = ref<any>(null)

    const isAuthenticated = computed(() => !!token.value)

    async function login(username: string, password: string) {
        const { login: loginApi } = await import('@/services')
        const res = await loginApi({ username, password })
        token.value = res.data.access_token
        user.value = (res.data as any).user
        localStorage.setItem('token', res.data.access_token)
    }

    async function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
    }

    return { token, user, isAuthenticated, login, logout }
})
