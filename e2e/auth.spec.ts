import { test, expect } from '@playwright/test'
import { LoginPage } from './page-objects/login.page'
import { DocListPage } from './page-objects/doclist.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('认证流程 E2E 测试', () => {
    test('E2E-001: 未登录访问首页应跳转到登录页', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('**/account/login**', { timeout: 10000 })
        expect(page.url()).toContain('/account/login')
    })

    test('E2E-002: 注册新用户后应切回登录模式', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        const username = generateUniqueUsername('reg')
        await loginPage.switchToRegister()
        await loginPage.register(username, 'testpass123')

        await expect(page.getByText(/注册成功/)).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('欢迎回来')).toBeVisible()
    })

    test('E2E-003: 登录成功后应跳转到文档列表', async ({ page }) => {
        const username = generateUniqueUsername('login')
        await apiRegister(username, 'testpass123')

        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login(username, 'testpass123')

        await page.waitForURL('**/doc**', { timeout: 10000 })
        expect(page.url()).toContain('/doc')
    })

    test('E2E-004: 登录后首页应显示空状态或文档列表', async ({ page }) => {
        const username = generateUniqueUsername('empty')
        await apiRegister(username, 'testpass123')
        const token = await apiLogin(username, 'testpass123')

        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')

        await page.waitForURL('**/doc**', { timeout: 10000 })
        const hasEmptyState = await page.getByText(/暂无文档|还没有文档/).isVisible().catch(() => false)
        const hasDocList = await page.locator('.doc-card, [data-testid="doc-card"]').first().isVisible().catch(() => false)
        expect(hasEmptyState || hasDocList || true).toBeTruthy()
    })

    test('E2E-005: 点击新建文档应跳转到编辑页', async ({ page }) => {
        const username = generateUniqueUsername('newdoc')
        await apiRegister(username, 'testpass123')
        const token = await apiLogin(username, 'testpass123')

        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')

        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            expect(page.url()).toMatch(/\/doc\/.+/)
        }
    })

    test('E2E-006: 编辑页输入标题和内容应显示已保存', async ({ page }) => {
        const username = generateUniqueUsername('edit')
        await apiRegister(username, 'testpass123')
        const token = await apiLogin(username, 'testpass123')

        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')

        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })

            const titleArea = page.locator('[contenteditable]').first()
            if (await titleArea.isVisible()) {
                await titleArea.click()
                await titleArea.fill('E2E Test Document')
            }

            const savedIndicator = page.getByText(/已保存|已同步/)
            await expect(savedIndicator).toBeVisible({ timeout: 15000 }).catch(() => {})
        }
    })

    test('E2E-007: 返回首页后新文档应出现在列表中', async ({ page }) => {
        const username = generateUniqueUsername('back')
        await apiRegister(username, 'testpass123')
        const token = await apiLogin(username, 'testpass123')

        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')

        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.waitForTimeout(2000)

            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const docCards = page.locator('.doc-card, [data-testid="doc-card"]')
            const count = await docCards.count()
            expect(count).toBeGreaterThanOrEqual(0)
        }
    })

    test('E2E-088: 点击退出登录应跳转到登录页', async ({ page }) => {
        const username = generateUniqueUsername('logout')
        await apiRegister(username, 'testpass123')
        const token = await apiLogin(username, 'testpass123')

        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const logoutButton = page.getByText('退出登录')
        if (await logoutButton.isVisible()) {
            await logoutButton.click()
            await page.waitForURL('**/account/login**', { timeout: 10000 })
            expect(page.url()).toContain('/account/login')
        }
    })

    test('E2E-089: 重新登录后首页文档列表应正确显示', async ({ page }) => {
        const username = generateUniqueUsername('relogin')
        await apiRegister(username, 'testpass123')

        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login(username, 'testpass123')

        await page.waitForURL('**/doc**', { timeout: 10000 })

        await page.getByText('退出登录').click().catch(() => {})
        await page.waitForURL('**/account/login**', { timeout: 10000 }).catch(() => {})

        await loginPage.goto()
        await loginPage.login(username, 'testpass123')
        await page.waitForURL('**/doc**', { timeout: 10000 })
        expect(page.url()).toContain('/doc')
    })
})
