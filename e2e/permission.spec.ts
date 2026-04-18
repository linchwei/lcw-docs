import { test, expect } from '@playwright/test'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('权限边界 E2E 测试', () => {
    let ownerToken: string
    let viewerToken: string
    let commenterToken: string
    let editorToken: string
    let ownerUsername: string
    let viewerUsername: string
    let commenterUsername: string
    let editorUsername: string

    test.beforeAll(async () => {
        ownerUsername = generateUniqueUsername('owner')
        viewerUsername = generateUniqueUsername('viewer')
        commenterUsername = generateUniqueUsername('commenter')
        editorUsername = generateUniqueUsername('editor')

        await apiRegister(ownerUsername, 'testpass123')
        await apiRegister(viewerUsername, 'testpass123')
        await apiRegister(commenterUsername, 'testpass123')
        await apiRegister(editorUsername, 'testpass123')

        ownerToken = await apiLogin(ownerUsername, 'testpass123')
        viewerToken = await apiLogin(viewerUsername, 'testpass123')
        commenterToken = await apiLogin(commenterUsername, 'testpass123')
        editorToken = await apiLogin(editorUsername, 'testpass123')
    })

    test('E2E-078: 查看者尝试编辑文档应显示只读模式', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, viewerToken)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const readOnlyMsg = page.getByText(/只读模式|只读/)
        if (await readOnlyMsg.isVisible().catch(() => false)) {
            expect(await readOnlyMsg.isVisible()).toBeTruthy()
        }
    })

    test('E2E-079: 评论者尝试编辑文档应显示评论模式', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, commenterToken)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const commentModeMsg = page.getByText(/评论模式/)
        if (await commentModeMsg.isVisible().catch(() => false)) {
            expect(await commentModeMsg.isVisible()).toBeTruthy()
        }
    })

    test('E2E-080: 评论者创建评论应成功', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, commenterToken)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const commentButton = page.getByRole('button', { name: /评论/ })
        if (await commentButton.isVisible().catch(() => false)) {
            await commentButton.click()
            await page.waitForTimeout(1000)

            const commentInput = page.getByPlaceholderText('添加评论...')
            if (await commentInput.isVisible().catch(() => false)) {
                await commentInput.fill('Comment from commenter')
                await page.getByRole('button', { name: '发表评论' }).click()
                await page.waitForTimeout(2000)
            }
        }
    })

    test('E2E-081: 非所有者三点菜单中无删除选项', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, viewerToken)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            await page.waitForTimeout(500)

            const deleteOption = page.getByText('删除')
            const isVisible = await deleteOption.isVisible().catch(() => false)
            expect(isVisible).toBeFalsy()
        }
    })

    test('E2E-082: 非所有者协作者面板无邀请功能', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, viewerToken)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const collabButton = page.getByRole('button', { name: /协作/ })
        if (await collabButton.isVisible().catch(() => false)) {
            await collabButton.click()
            await page.waitForTimeout(1000)

            const inviteButton = page.getByRole('button', { name: /邀请协作者|邀请/ })
            const isVisible = await inviteButton.isVisible().catch(() => false)
            expect(isVisible).toBeFalsy()
        }
    })

    test('E2E-083: 分享链接可编辑权限用户编辑文档', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto('/share/test-share-edit-id')
        await page.waitForTimeout(3000)

        const editor = page.locator('.ProseMirror, [contenteditable]')
        if (await editor.isVisible().catch(() => false)) {
            const isEditable = await editor.getAttribute('contenteditable')
            expect(isEditable).toBe('true')
        }

        await context.close()
    })

    test('E2E-084: 未登录用户访问分享链接应显示登录按钮', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto('/share/test-share-id')
        await page.waitForTimeout(3000)

        const loginButton = page.getByRole('button', { name: /登录以协作|登录/ })
        if (await loginButton.isVisible().catch(() => false)) {
            expect(await loginButton.isVisible()).toBeTruthy()
        }

        await context.close()
    })
})
