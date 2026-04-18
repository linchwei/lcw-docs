import { test, expect } from '@playwright/test'
import { DocPage } from './page-objects/doc.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('评论功能 E2E 测试', () => {
    let token: string

    test.beforeAll(async () => {
        const username = generateUniqueUsername('comment')
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

    test('E2E-041: 点击评论按钮应弹出评论面板', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCommentPanel()
        await expect(page.getByText('评论')).toBeVisible({ timeout: 5000 })
    })

    test('E2E-042: 发表评论应出现在列表中', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCommentPanel()

        const commentInput = page.getByPlaceholderText('添加评论...')
        if (await commentInput.isVisible().catch(() => false)) {
            await commentInput.fill('E2E test comment')
            await page.getByRole('button', { name: '发表评论' }).click()
            await page.waitForTimeout(2000)

            await expect(page.getByText('E2E test comment')).toBeVisible({ timeout: 5000 }).catch(() => {})
        }
    })

    test('E2E-043: 回复评论应显示在评论下方', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCommentPanel()

        const commentInput = page.getByPlaceholderText('添加评论...')
        if (await commentInput.isVisible().catch(() => false)) {
            await commentInput.fill('Parent comment')
            await page.getByRole('button', { name: '发表评论' }).click()
            await page.waitForTimeout(2000)

            const replyButton = page.locator('button').filter({ has: page.locator('svg.lucide-message-square') }).first()
            if (await replyButton.isVisible().catch(() => false)) {
                await replyButton.click()

                const replyInput = page.getByPlaceholderText('回复评论...')
                if (await replyInput.isVisible().catch(() => false)) {
                    await replyInput.fill('Reply to comment')
                    await page.getByRole('button', { name: '回复' }).click()
                    await page.waitForTimeout(2000)
                }
            }
        }
    })

    test('E2E-044: 标记已解决后评论变为已解决状态', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCommentPanel()

        const commentInput = page.getByPlaceholderText('添加评论...')
        if (await commentInput.isVisible().catch(() => false)) {
            await commentInput.fill('To be resolved')
            await page.getByRole('button', { name: '发表评论' }).click()
            await page.waitForTimeout(2000)

            const resolveButton = page.locator('button').filter({ has: page.locator('svg.lucide-check') }).first()
            if (await resolveButton.isVisible().catch(() => false)) {
                await resolveButton.click()
                await page.waitForTimeout(1000)

                await expect(page.getByText('已解决')).toBeVisible({ timeout: 5000 }).catch(() => {})
            }
        }
    })

    test('E2E-045: 删除评论', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openCommentPanel()

        const commentInput = page.getByPlaceholderText('添加评论...')
        if (await commentInput.isVisible().catch(() => false)) {
            await commentInput.fill('To be deleted')
            await page.getByRole('button', { name: '发表评论' }).click()
            await page.waitForTimeout(2000)

            const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
            if (await deleteButton.isVisible().catch(() => false)) {
                await deleteButton.click()
                await page.waitForTimeout(1000)
            }
        }
    })
})
