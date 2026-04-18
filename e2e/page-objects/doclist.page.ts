import { Page, Locator } from '@playwright/test'

export class DocListPage {
  readonly page: Page
  readonly newDocButton: Locator
  readonly searchInput: Locator
  readonly docCards: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.newDocButton = page.getByRole('button', { name: /新建|新建文档/ }).first()
    this.searchInput = page.getByPlaceholder(/搜索/)
    this.docCards = page.locator('[data-testid="doc-card"], .doc-card')
    this.emptyState = page.getByText(/暂无文档|还没有文档/)
  }

  async goto() {
    await this.page.goto('/doc')
  }

  async createNewDoc() {
    await this.newDocButton.click()
    await this.page.waitForURL('**/doc/**', { timeout: 10000 })
  }

  async getDocCardByTitle(title: string): Promise<Locator> {
    return this.page.locator(`[data-testid="doc-card"], .doc-card`).filter({ hasText: title }).first()
  }

  async openDocMenu(title: string) {
    const card = await this.getDocCardByTitle(title)
    await card.getByRole('button', { name: /更多|菜单|\.\.\./ }).or(card.locator('button').last()).click()
  }

  async searchDoc(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500)
  }

  async getDocCount(): Promise<number> {
    return this.docCards.count()
  }
}
