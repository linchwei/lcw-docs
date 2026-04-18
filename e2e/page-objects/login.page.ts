import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly registerLink: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByPlaceholder('请输入用户名')
    this.passwordInput = page.getByPlaceholder('请输入密码')
    this.submitButton = page.getByRole('button', { name: /登录|注册/ })
    this.registerLink = page.getByText('立即注册')
    this.loginLink = page.getByText('立即登录')
  }

  async goto() {
    await this.page.goto('/account/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async register(username: string, password: string) {
    await this.registerLink.click()
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async switchToRegister() {
    await this.registerLink.click()
  }

  async switchToLogin() {
    await this.loginLink.click()
  }
}
