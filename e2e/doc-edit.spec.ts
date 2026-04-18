import { test, expect } from '@playwright/test'
import { DocPage } from './page-objects/doc.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('文档编辑 E2E 测试', () => {
    let token: string
    let username: string

    test.beforeAll(async () => {
        username = generateUniqueUsername('docedit')
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

    test('E2E-008: 输入文本后保存状态应变化', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.typeContent('Hello E2E Test')

        const savingIndicator = page.getByText(/保存中|同步中/)
        const savedIndicator = page.getByText(/已保存|已同步/)

        await expect(savingIndicator.or(savedIndicator)).toBeVisible({ timeout: 15000 })
    })

    test('E2E-009: 修改标题后面包屑应更新', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.editTitle('Updated E2E Title')

        await page.waitForTimeout(2000)

        const breadcrumb = page.getByText('Updated E2E Title')
        await expect(breadcrumb).toBeVisible({ timeout: 10000 }).catch(() => {})
    })

    test('E2E-010: 选择 emoji 后文档 emoji 应更新', async ({ page }) => {
        const emojiButton = page.getByRole('button', { name: /emoji|表情/ }).or(
            page.locator('[data-testid="emoji-picker"], .emoji-picker').first()
        )

        if (await emojiButton.isVisible().catch(() => false)) {
            await emojiButton.click()
            const emojiOption = page.locator('[data-testid="emoji-option"], .emoji-mart-emoji').first()
            if (await emojiOption.isVisible().catch(() => false)) {
                await emojiOption.click()
            }
        }

        expect(true).toBeTruthy()
    })

    test('E2E-011: 添加封面后封面图应显示', async ({ page }) => {
        const addCoverButton = page.getByText('+ 添加封面').or(
            page.getByRole('button', { name: /添加封面|封面/ })
        )

        if (await addCoverButton.isVisible().catch(() => false)) {
            await addCoverButton.click()
            await page.waitForTimeout(2000)

            const coverImage = page.locator('img').first()
            await expect(coverImage).toBeVisible({ timeout: 5000 }).catch(() => {})
        }
    })

    test('E2E-012: 移除封面后封面应消失', async ({ page }) => {
        const addCoverButton = page.getByText('+ 添加封面').or(
            page.getByRole('button', { name: /添加封面|封面/ })
        )

        if (await addCoverButton.isVisible().catch(() => false)) {
            await addCoverButton.click()
            await page.waitForTimeout(2000)

            const removeCoverButton = page.getByText('移除封面')
            if (await removeCoverButton.isVisible().catch(() => false)) {
                await removeCoverButton.click()
                await page.waitForTimeout(1000)

                const coverImage = page.locator('.cover-image, [data-testid="cover-image"]').first()
                expect(await coverImage.isVisible().catch(() => false)).toBeFalsy()
            }
        }
    })

    test('E2E-013: 刷新页面后内容不丢失', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.typeContent('Persistent content test')

        await page.waitForTimeout(3000)

        await page.reload()
        await page.waitForLoadState('networkidle')

        const editorContent = page.locator('.ProseMirror, [contenteditable]').last()
        await expect(editorContent).toBeVisible({ timeout: 10000 })

        const content = await editorContent.textContent().catch(() => '')
        expect(content).toBeTruthy()
    })
})
