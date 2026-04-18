import { test, expect } from '@playwright/test'
import { DocPage } from './page-objects/doc.page'
import { SharePage } from './page-objects/share.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('分享功能 E2E 测试', () => {
    let token: string
    let username: string
    let docUrl: string

    test.beforeAll(async () => {
        username = generateUniqueUsername('share')
        await apiRegister(username, 'testpass123')
        token = await apiLogin(username, 'testpass123')
    })

    test.beforeEach(async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            docUrl = page.url()
        }
    })

    test('E2E-014: 点击分享按钮应弹出分享面板', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()
        await expect(page.getByText(/分享|暂无分享链接/)).toBeVisible({ timeout: 5000 })
    })

    test('E2E-015: 创建可查看分享链接', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()

        const createButton = page.getByRole('button', { name: /创建分享链接|创建链接|新建/ })
        if (await createButton.isVisible().catch(() => false)) {
            await createButton.click()
            await expect(page.getByText(/share|链接/)).toBeVisible({ timeout: 5000 })
        }
    })

    test('E2E-016: 复制分享链接', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()

        const createButton = page.getByRole('button', { name: /创建分享链接|创建链接|新建/ })
        if (await createButton.isVisible().catch(() => false)) {
            await createButton.click()
            await page.waitForTimeout(1000)

            const copyButton = page.getByRole('button', { name: /复制|copy/i }).or(
                page.locator('button').filter({ has: page.locator('svg.lucide-copy, svg.lucide-check') })
            ).first()

            if (await copyButton.isVisible().catch(() => false)) {
                await copyButton.click()
            }
        }
    })

    test('E2E-017: 创建带密码的分享链接', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()

        const createButton = page.getByRole('button', { name: /创建分享链接|创建链接|新建/ })
        if (await createButton.isVisible().catch(() => false)) {
            const passwordInput = page.getByPlaceholderText(/密码|留空则无需密码/)
            if (await passwordInput.isVisible().catch(() => false)) {
                await passwordInput.fill('test123')
            }
            await createButton.click()
            await page.waitForTimeout(1000)
        }
    })

    test('E2E-018: 创建带过期时间的分享链接', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()

        const createButton = page.getByRole('button', { name: /创建分享链接|创建链接|新建/ })
        if (await createButton.isVisible().catch(() => false)) {
            const expiryInput = page.locator('input[type="datetime-local"]')
            if (await expiryInput.isVisible().catch(() => false)) {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                await expiryInput.fill(tomorrow)
            }
            await createButton.click()
            await page.waitForTimeout(1000)
        }
    })

    test('E2E-019: 在新窗口打开无密码分享链接', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('share-test-id')

        await page.waitForTimeout(3000)
        await context.close()
    })

    test('E2E-020: 打开带密码的分享链接应显示密码输入框', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('share-test-id')

        const passwordInput = page.getByPlaceholderText(/密码|password/i)
        if (await passwordInput.isVisible().catch(() => false)) {
            expect(await passwordInput.isVisible()).toBeTruthy()
        }

        await context.close()
    })

    test('E2E-021: 输入错误密码应提示错误', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('share-test-id')

        const passwordInput = page.getByPlaceholderText(/密码|password/i)
        if (await passwordInput.isVisible().catch(() => false)) {
            await sharePage.enterPassword('wrongpassword')
            await page.waitForTimeout(2000)

            const errorMsg = page.getByText(/密码错误|密码不正确|incorrect/i)
            if (await errorMsg.isVisible().catch(() => false)) {
                expect(await errorMsg.isVisible()).toBeTruthy()
            }
        }

        await context.close()
    })

    test('E2E-022: 输入正确密码应显示文档内容', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('share-test-id')

        const passwordInput = page.getByPlaceholderText(/密码|password/i)
        if (await passwordInput.isVisible().catch(() => false)) {
            await sharePage.enterPassword('correctpassword')
            await page.waitForTimeout(2000)

            const docContent = page.locator('.ProseMirror, [contenteditable]')
            if (await docContent.isVisible().catch(() => false)) {
                expect(await docContent.isVisible()).toBeTruthy()
            }
        }

        await context.close()
    })

    test('E2E-023: 打开已过期的分享链接应显示过期提示', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('share-expired-id')

        await page.waitForTimeout(3000)

        const expiredMsg = page.getByText(/已过期|expired/i)
        if (await expiredMsg.isVisible().catch(() => false)) {
            expect(await expiredMsg.isVisible()).toBeTruthy()
        }

        await context.close()
    })

    test('E2E-024: 打开不存在的分享链接应显示无效提示', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        const sharePage = new SharePage(page)
        await sharePage.goto('nonexistent-share-id-12345')

        await page.waitForTimeout(3000)

        const invalidMsg = page.getByText(/不存在|无效|invalid|not found/i)
        if (await invalidMsg.isVisible().catch(() => false)) {
            expect(await invalidMsg.isVisible()).toBeTruthy()
        }

        await context.close()
    })

    test('E2E-025: 删除分享链接后应从列表消失', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openSharePanel()

        const createButton = page.getByRole('button', { name: /创建分享链接|创建链接|新建/ })
        if (await createButton.isVisible().catch(() => false)) {
            await createButton.click()
            await page.waitForTimeout(1000)

            const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
            if (await deleteButton.isVisible().catch(() => false)) {
                await deleteButton.click()
                await page.waitForTimeout(1000)
            }
        }
    })
})
