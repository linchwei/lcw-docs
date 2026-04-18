import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders, mockAuthenticatedUser, clearAuthenticatedUser } from '@/test/helpers'

vi.mock('@/services', () => ({
    login: vi.fn().mockResolvedValue({ data: { access_token: 'mock-token' }, success: true }),
    register: vi.fn().mockResolvedValue({ data: { id: 1, username: 'newuser' }, success: true }),
}))

vi.mock('@/components/ThemeToggle', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}))

vi.mock('@/components/PasswordInput', () => ({
    PasswordInput: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid="password-input"
            type="password"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}))

vi.mock('@lcw-doc/shadcn-shared-ui/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}))

import { Login } from './index'

describe('Login Page', () => {
    beforeEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-001: should render login form', () => {
        renderWithProviders(<Login />)
        expect(screen.getByText('欢迎回来')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument()
        expect(screen.getByTestId('password-input')).toBeInTheDocument()
    })

    it('UI-002: should show validation state on empty submit', async () => {
        const user = userEvent.setup()
        renderWithProviders(<Login />)

        const submitButton = screen.getByRole('button', { name: '登录' })
        await user.click(submitButton)

        await waitFor(() => {
            const usernameInput = screen.getByPlaceholderText('请输入用户名')
            expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
        })
    })

    it('UI-005: should switch to register form', async () => {
        const user = userEvent.setup()
        renderWithProviders(<Login />)

        const registerLink = screen.getByText('立即注册')
        await user.click(registerLink)

        expect(screen.getByText('创建账号')).toBeInTheDocument()
    })

    it('UI-006: should switch back to login form after register', async () => {
        const user = userEvent.setup()
        renderWithProviders(<Login />)

        const registerLink = screen.getByText('立即注册')
        await user.click(registerLink)

        expect(screen.getByText('创建账号')).toBeInTheDocument()

        const loginLink = screen.getByText('立即登录')
        await user.click(loginLink)

        expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    })
})
