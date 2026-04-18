import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders, clearAuthenticatedUser } from '@/test/helpers'

vi.mock('@/services', () => ({
    login: vi.fn(),
    register: vi.fn(),
}))

vi.mock('@/components/ThemeToggle', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}))

vi.mock('@/components/PasswordInput', () => ({
    PasswordInput: ({ value, onChange, placeholder }: any) => (
        <div>
            <input
                data-testid="password-input"
                type="password"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <button
                type="button"
                aria-label="显示密码"
                data-testid="password-toggle"
                onClick={() => {
                    const input = document.querySelector('[data-testid="password-input"]') as HTMLInputElement
                    if (input) input.type = input.type === 'password' ? 'text' : 'password'
                }}
            />
        </div>
    ),
}))

vi.mock('@lcw-doc/shadcn-shared-ui/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}))

import { login, register } from '@/services'
import { Login } from '@/pages/Account/Login'

const mockedLogin = login as ReturnType<typeof vi.fn>
const mockedRegister = register as ReturnType<typeof vi.fn>

describe('Login Interaction Tests', () => {
    beforeEach(() => {
        clearAuthenticatedUser()
        vi.clearAllMocks()
    })

    it('UI-INT-001: should disable submit button during login', async () => {
        const user = userEvent.setup()
        mockedLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { access_token: 'token' }, success: true }), 2000)))

        renderWithProviders(<Login />)

        await user.type(screen.getByPlaceholderText('请输入用户名'), 'testuser')
        await user.type(screen.getByTestId('password-input'), 'testpass123')
        await user.click(screen.getByRole('button', { name: '登录' }))

        await waitFor(() => {
            expect(screen.getByText('处理中...')).toBeInTheDocument()
        })

        const submitButton = screen.getByRole('button', { name: /处理中|登录/ })
        expect(submitButton).toBeDisabled()
    })

    it('UI-INT-002: should allow resubmission after login failure', async () => {
        const user = userEvent.setup()
        mockedLogin
            .mockRejectedValueOnce(new Error('Login failed'))
            .mockResolvedValueOnce({ data: { access_token: 'token' }, success: true })

        renderWithProviders(<Login />)

        await user.type(screen.getByPlaceholderText('请输入用户名'), 'testuser')
        await user.type(screen.getByTestId('password-input'), 'wrongpass')
        await user.click(screen.getByRole('button', { name: '登录' }))

        await waitFor(() => {
            expect(mockedLogin).toHaveBeenCalledTimes(1)
        })

        const submitButton = screen.getByRole('button', { name: '登录' })
        expect(submitButton).not.toBeDisabled()

        await user.click(screen.getByRole('button', { name: '登录' }))
        await waitFor(() => {
            expect(mockedLogin).toHaveBeenCalledTimes(2)
        })
    })

    it('UI-INT-003: should toggle password visibility', async () => {
        const user = userEvent.setup()
        renderWithProviders(<Login />)

        const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
        expect(passwordInput.type).toBe('password')

        await user.click(screen.getByTestId('password-toggle'))
        expect(passwordInput.type).toBe('text')

        await user.click(screen.getByTestId('password-toggle'))
        expect(passwordInput.type).toBe('password')
    })

    it('UI-INT-004: should switch back to login after successful registration', async () => {
        const user = userEvent.setup()
        mockedRegister.mockResolvedValue({ data: { id: 1, username: 'newuser' }, success: true })

        renderWithProviders(<Login />)

        await user.click(screen.getByText('立即注册'))
        expect(screen.getByText('创建账号')).toBeInTheDocument()

        await user.type(screen.getByPlaceholderText('请输入用户名'), 'newuser')
        await user.type(screen.getByTestId('password-input'), 'newpass123')
        await user.click(screen.getByRole('button', { name: '注册' }))

        await waitFor(() => {
            expect(mockedRegister).toHaveBeenCalledTimes(1)
        })

        await waitFor(() => {
            expect(screen.getByText('欢迎回来')).toBeInTheDocument()
        })
    })
})
