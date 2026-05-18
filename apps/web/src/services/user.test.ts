import { beforeEach, describe, expect, it } from 'vitest'

import { clearAuthenticatedUser, mockAuthenticatedUser } from '../test/helpers'
import { currentUser, login, logout, register } from './user'

describe('user service', () => {
    beforeEach(() => {
        clearAuthenticatedUser()
    })

    describe('SRV-001: login', () => {
        it('should login with correct credentials', async () => {
            const res = await login({ username: 'testuser', password: 'testpass123' })
            expect(res).toHaveProperty('data')
            expect(res.data).toHaveProperty('access_token')
            expect(res.success).toBe(true)
        })

        it('should fail with wrong credentials', async () => {
            await expect(login({ username: 'wrong', password: 'wrong' })).rejects.toThrow()
        })
    })

    describe('SRV-002: register', () => {
        it('should register a new user', async () => {
            const res = await register({ username: 'newuser', password: 'testpass123' })
            expect(res).toHaveProperty('data')
            expect(res.success).toBe(true)
        })

        it('should fail with duplicate username', async () => {
            await expect(register({ username: 'duplicateuser', password: 'testpass123' })).rejects.toThrow()
        })
    })

    describe('SRV-003: currentUser', () => {
        it('should return current user when authenticated', async () => {
            mockAuthenticatedUser()
            const res = await currentUser()
            expect(res).toHaveProperty('data')
            expect(res.data).toHaveProperty('username', 'testuser')
        })

        it('should fail when not authenticated', async () => {
            await expect(currentUser()).rejects.toThrow()
        })
    })

    describe('SRV-004: logout', () => {
        it('should logout successfully', async () => {
            mockAuthenticatedUser()
            const res = await logout()
            expect(res).toHaveProperty('success', true)
        })
    })
})
