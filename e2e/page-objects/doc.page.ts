import { Page, Locator } from '@playwright/test'

export class DocPage {
  readonly page: Page
  readonly titleInput: Locator
  readonly shareButton: Locator
  readonly versionButton: Locator
  readonly commentButton: Locator
  readonly collaboratorButton: Locator
  readonly saveStatus: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.locator('[data-testid="doc-title"], [contenteditable]').first()
    this.shareButton = page.getByRole('button', { name: /分享|share/i }).or(page.locator('button[aria-label="share"], button[aria-label="分享"]'))
    this.versionButton = page.getByRole('button', { name: /版本|version/i }).or(page.locator('button[aria-label="version"], button[aria-label="版本"]'))
    this.commentButton = page.getByRole('button', { name: /评论|comment/i }).or(page.locator('button[aria-label="comment"], button[aria-label="评论"]'))
    this.collaboratorButton = page.getByRole('button', { name: /协作|collaborator/i }).or(page.locator('button[aria-label="collaborator"], button[aria-label="协作"]'))
    this.saveStatus = page.locator('[data-testid="save-status"], .save-status')
  }

  async goto(docId: string) {
    await this.page.goto(`/doc/${docId}`)
  }

  async editTitle(title: string) {
    await this.titleInput.click()
    await this.titleInput.fill(title)
  }

  async typeContent(text: string) {
    const editor = this.page.locator('.ProseMirror, [contenteditable]').last()
    await editor.click()
    await editor.type(text)
  }

  async openSharePanel() {
    await this.shareButton.click()
  }

  async openVersionPanel() {
    await this.versionButton.click()
  }

  async openCommentPanel() {
    await this.commentButton.click()
  }

  async openCollaboratorPanel() {
    await this.collaboratorButton.click()
  }

  async waitForSaved(timeout = 10000) {
    await this.page.getByText(/已保存|已同步/).waitFor({ state: 'visible', timeout })
  }

  async addCover() {
    await this.page.getByRole('button', { name: /添加封面|封面/ }).click()
  }

  async removeCover() {
    await this.page.getByRole('button', { name: /移除封面|删除封面/ }).click()
  }
}
