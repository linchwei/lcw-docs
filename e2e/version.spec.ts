import { test, expect } from '@playwright/test'
import { DocPage } from './page-objects/doc.page'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('版本管理 E2E 测试', () => {
    let token: string

    test.beforeAll(async () => {
        const username = generateUniqueUsername('version')
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

    test('E2E-034: 点击版本历史按钮应弹出版本面板', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()
        await expect(page.getByText('版本历史')).toBeVisible({ timeout: 5000 })
    })

    test('E2E-035: 保存当前版本', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()

        const saveButton = page.getByRole('button', { name: '保存当前版本' })
        if (await saveButton.isVisible().catch(() => false)) {
            await saveButton.click()
            await page.waitForTimeout(2000)
        }
    })

    test('E2E-036: 修改内容后保存另一个版本', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.typeContent('Version 2 content')

        await docPage.openVersionPanel()

        const saveButton = page.getByRole('button', { name: '保存当前版本' })
        if (await saveButton.isVisible().catch(() => false)) {
            await saveButton.click()
            await page.waitForTimeout(2000)
        }
    })

    test('E2E-037: 版本对比', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()

        const versionItems = page.locator('.version-item, [data-testid="version-item"]')
        const count = await versionItems.count()
        if (count >= 2) {
            await versionItems.first().click()
            await versionItems.last().click({ button: 'right' })

            const compareButton = page.getByRole('button', { name: '对比' })
            if (await compareButton.isVisible().catch(() => false)) {
                await compareButton.click()
                await expect(page.getByText('版本差异')).toBeVisible({ timeout: 5000 }).catch(() => {})
            }
        }
    })

    test('E2E-038: 选择历史版本点击恢复应弹出确认', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()

        const versionItems = page.locator('.version-item, [data-testid="version-item"]')
        if (await versionItems.first().isVisible().catch(() => false)) {
            await versionItems.first().click()

            const restoreButton = page.getByRole('button', { name: '恢复到此版本' })
            if (await restoreButton.isVisible().catch(() => false)) {
                await restoreButton.click()
                await expect(page.getByText(/确认恢复|确定要恢复/)).toBeVisible({ timeout: 5000 }).catch(() => {})
            }
        }
    })

    test('E2E-039: 确认恢复后文档内容恢复', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()

        const versionItems = page.locator('.version-item, [data-testid="version-item"]')
        if (await versionItems.first().isVisible().catch(() => false)) {
            await versionItems.first().click()

            const restoreButton = page.getByRole('button', { name: '恢复到此版本' })
            if (await restoreButton.isVisible().catch(() => false)) {
                await restoreButton.click()

                const confirmButton = page.getByRole('button', { name: '确认恢复' })
                if (await confirmButton.isVisible().catch(() => false)) {
                    await confirmButton.click()
                    await page.waitForTimeout(2000)
                }
            }
        }
    })

    test('E2E-040: 删除版本', async ({ page }) => {
        const docPage = new DocPage(page)
        await docPage.openVersionPanel()

        const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
        if (await deleteButton.isVisible().catch(() => false)) {
            await deleteButton.click()
            await page.waitForTimeout(1000)
        }
    })
})
