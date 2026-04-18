import { Page, Locator } from '@playwright/test'

export class SharePage {
  readonly page: Page
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly docContent: Locator
  readonly expiredMessage: Locator
  readonly invalidMessage: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.passwordInput = page.getByPlaceholder(/密码|password/i)
    this.submitButton = page.getByRole('button', { name: /确认|提交|访问|查看/ })
    this.docContent = page.locator('[data-testid="share-content"], .share-content, .ProseMirror')
    this.expiredMessage = page.getByText(/已过期|expired/i)
    this.invalidMessage = page.getByText(/不存在|无效|invalid/i)
    this.loginButton = page.getByRole('button', { name: /登录以协作|登录/ })
  }

  async goto(shareId: string) {
    await this.page.goto(`/share/${shareId}`)
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async isDocVisible(): Promise<boolean> {
    return this.docContent.isVisible()
  }

  async isExpired(): Promise<boolean> {
    return this.expiredMessage.isVisible()
  }

  async isInvalid(): Promise<boolean> {
    return this.invalidMessage.isVisible()
  }
}
