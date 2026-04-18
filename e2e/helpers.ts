import { Page, expect } from '@playwright/test'

export async function login(page: Page, username: string, password: string) {
  await page.goto('/account/login')
  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL('**/doc**', { timeout: 10000 })
}

export async function register(page: Page, username: string, password: string) {
  await page.goto('/account/login')
  await page.getByText('立即注册').click()
  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByRole('button', { name: '注册' }).click()
}

export async function apiLogin(username: string, password: string): Promise<string> {
  const response = await fetch('http://localhost:8082/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const result = await response.json()
  return result.data.access_token
}

export async function apiRegister(username: string, password: string) {
  await fetch('http://localhost:8082/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export async function createTestDocument(page: Page, title = '测试文档') {
  await page.goto('/doc')
  await page.getByRole('button', { name: /新建|新建文档/ }).first().click()
  await page.waitForURL('**/doc/**', { timeout: 10000 })
  const titleInput = page.locator('[data-testid="doc-title"], [contenteditable]').first()
  if (await titleInput.isVisible()) {
    await titleInput.click()
    await titleInput.fill(title)
  }
  return page.url()
}

export async function waitForSaveStatus(page: Page, status: string, timeout = 10000) {
  await page.getByText(status, { exact: false }).waitFor({ state: 'visible', timeout })
}

export async function setToken(page: Page, token: string) {
  await page.evaluate((t) => localStorage.setItem('token', t), token)
}

export async function clearToken(page: Page) {
  await page.evaluate(() => localStorage.removeItem('token'))
}

export function generateUniqueUsername(prefix = 'e2e') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
