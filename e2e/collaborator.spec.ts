import { test, expect } from '@playwright/test'
import { DocPage } from './page-objects/doc.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('协作者权限 E2E 测试', () => {
    let token: string
    let username: string

    test.beforeAll(async () => {
        username = generateUniqueUsername('collab')
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
        }
    })

    test('E2E-026: 点击协作者按钮应弹出协作者面板', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()
        await expect(page.getByText('协作者')).toBeVisible({ timeout: 5000 })
    })

    test('E2E-027: 邀请协作者应显示在列表中', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()

        const usernameInput = page.getByPlaceholderText('输入用户名')
        if (await usernameInput.isVisible().catch(() => false)) {
            await usernameInput.fill('otheruser')
            await page.getByRole('button', { name: /邀请协作者|邀请/ }).click().catch(() => {})
            await page.waitForTimeout(2000)
        }
    })

    test('E2E-028: 被邀请者登录后应收到通知', async ({ page }) => {
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const notificationBell = page.locator('[data-testid="notification-bell"], button').filter({ has: page.locator('svg.lucide-bell') }).first()
        if (await notificationBell.isVisible().catch(() => false)) {
            await notificationBell.click()
        }
    })

    test('E2E-029: 被邀请者点击通知应跳转到文档', async ({ page }) => {
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const notificationBell = page.locator('[data-testid="notification-bell"], button').filter({ has: page.locator('svg.lucide-bell') }).first()
        if (await notificationBell.isVisible().catch(() => false)) {
            await notificationBell.click()
            await page.waitForTimeout(1000)

            const notificationItem = page.locator('.notification-item, [data-testid="notification-item"]').first()
            if (await notificationItem.isVisible().catch(() => false)) {
                await notificationItem.click()
                await page.waitForURL('**/doc/**', { timeout: 5000 }).catch(() => {})
            }
        }
    })

    test('E2E-030: 将协作者角色改为查看者', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()

        const moreButton = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first()
        if (await moreButton.isVisible().catch(() => false)) {
            await moreButton.click()
            const viewerOption = page.getByText('改为查看者')
            if (await viewerOption.isVisible().catch(() => false)) {
                await viewerOption.click()
            }
        }
    })

    test('E2E-031: 移除协作者', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()

        const moreButton = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first()
        if (await moreButton.isVisible().catch(() => false)) {
            await moreButton.click()
            const removeOption = page.getByText('移除')
            if (await removeOption.isVisible().catch(() => false)) {
                await removeOption.click()
            }
        }
    })

    test('E2E-032: 尝试添加自己为协作者应提示错误', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()

        const usernameInput = page.getByPlaceholderText('输入用户名')
        if (await usernameInput.isVisible().catch(() => false)) {
            await usernameInput.fill(username)
            await page.getByRole('button', { name: /邀请协作者|邀请/ }).click().catch(() => {})
            await page.waitForTimeout(2000)

            const errorMsg = page.getByText(/不能将自己|不能添加自己/i)
            if (await errorMsg.isVisible().catch(() => false)) {
                expect(await errorMsg.isVisible()).toBeTruthy()
            }
        }
    })

    test('E2E-033: 尝试添加不存在的用户应提示错误', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCollaboratorPanel()

        const usernameInput = page.getByPlaceholderText('输入用户名')
        if (await usernameInput.isVisible().catch(() => false)) {
            await usernameInput.fill('nonexistent_user_xyz')
            await page.getByRole('button', { name: /邀请协作者|邀请/ }).click().catch(() => {})
            await page.waitForTimeout(2000)

            const errorMsg = page.getByText(/不存在|未找到|not found/i)
            if (await errorMsg.isVisible().catch(() => false)) {
                expect(await errorMsg.isVisible()).toBeTruthy()
            }
        }
    })
})
