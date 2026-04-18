import axios, { CreateAxiosDefaults } from 'axios'
import { toast } from 'sonner'

const config: CreateAxiosDefaults = {
    baseURL: '/api',
    timeout: 5000,
}

export const request = axios.create(config)

request.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        const status = error.response?.status
        if (status === 401) {
            window.location.href = '/account/login'
        } else if (status === 403) {
            const message = error.response?.data?.message || '您没有执行此操作的权限'
            toast.error(message)
        }
        return Promise.reject(error)
    }
)
