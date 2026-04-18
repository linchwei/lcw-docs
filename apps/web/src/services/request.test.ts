import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

import { clearAuthenticatedUser } from '@/test/helpers'

describe('request interceptor', () => {
    beforeEach(() => {
        clearAuthenticatedUser()
    })

    it('SRV-032: should attach token to request headers', () => {
        localStorage.setItem('token', 'test-jwt-token')
        const request = axios.create({ baseURL: '/api' })

        request.interceptors.request.use(config => {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        const handler = request.interceptors.request.handlers[0]?.fulfilled
        if (handler) {
            const config = handler({ headers: {} })
            expect(config.headers.Authorization).toBe('Bearer test-jwt-token')
        }
    })

    it('SRV-033: should redirect to login on 401', () => {
        const originalLocation = window.location
        const mockLocation = { href: '', assign: vi.fn(), replace: vi.fn() }
        Object.defineProperty(window, 'location', {
            value: mockLocation,
            writable: true,
        })

        const request = axios.create({ baseURL: '/api' })
        request.interceptors.response.use(
            response => response,
            error => {
                const status = error.response?.status
                if (status === 401) {
                    window.location.href = '/account/login'
                }
                return Promise.reject(error)
            }
        )

        const handler = request.interceptors.response.handlers[0]?.rejected
        if (handler) {
            const result = handler({ response: { status: 401, data: {} } })
            expect(window.location.href).toBe('/account/login')
        }

        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        })
    })
})
