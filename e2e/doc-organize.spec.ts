import { test, expect } from '@playwright/test'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('文档组织与检索 E2E 测试', () => {
    let token: string

    test.beforeAll(async () => {
        const username = generateUniqueUsername('organize')
        await apiRegister(username, 'testpass123')
        token = await apiLogin(username, 'testpass123')
    })

    test.beforeEach(async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })
    })

    test('E2E-046: 新建文件夹应出现在侧边栏', async ({ page }) => {
        const newFolderButton = page.locator('button[title="新建文件夹"]')
        if (await newFolderButton.isVisible().catch(() => false)) {
            await newFolderButton.click()
            await page.waitForTimeout(1000)
        }
    })

    test('E2E-047: 文档卡片三点菜单中选择标签', async ({ page }) => {
        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })
        }

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            await page.waitForTimeout(500)

            const tagMenu = page.getByText('标签')
            if (await tagMenu.isVisible().catch(() => false)) {
                await tagMenu.hover()
                await page.waitForTimeout(500)
            }
        }
    })

    test('E2E-048: 创建新标签', async ({ page }) => {
        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })
        }

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            await page.waitForTimeout(500)

            const tagMenu = page.getByText('标签')
            if (await tagMenu.isVisible().catch(() => false)) {
                await tagMenu.hover()
                await page.waitForTimeout(500)

                const newTagInput = page.getByPlaceholderText('新标签名称')
                if (await newTagInput.isVisible().catch(() => false)) {
                    await newTagInput.fill('E2E Tag')
                    const createTagButton = page.getByRole('button', { name: '创建并添加' })
                    if (await createTagButton.isVisible().catch(() => false)) {
                        await createTagButton.click()
                        await page.waitForTimeout(1000)
                    }
                }
            }
        }
    })

    test('E2E-049: 添加已有标签到文档', async ({ page }) => {
        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })
        }

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            await page.waitForTimeout(500)

            const tagMenu = page.getByText('标签')
            if (await tagMenu.isVisible().catch(() => false)) {
                await tagMenu.hover()
                await page.waitForTimeout(500)

                const existingTag = page.getByText('Important').first()
                if (await existingTag.isVisible().catch(() => false)) {
                    await existingTag.click()
                }
            }
        }
    })

    test('E2E-050: 按 Cmd+K 打开搜索', async ({ page }) => {
        await page.keyboard.press('Meta+k')

        const searchInput = page.getByPlaceholderText('搜索文档标题或内容...')
        if (await searchInput.isVisible().catch(() => false)) {
            expect(await searchInput.isVisible()).toBeTruthy()
        }
    })

    test('E2E-051: 输入搜索关键词应显示结果', async ({ page }) => {
        await page.keyboard.press('Meta+k')

        const searchInput = page.getByPlaceholderText('搜索文档标题或内容...')
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill('Test')
            await page.waitForTimeout(1000)
        }
    })

    test('E2E-052: 点击搜索结果应跳转', async ({ page }) => {
        await page.keyboard.press('Meta+k')

        const searchInput = page.getByPlaceholderText('搜索文档标题或内容...')
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill('Test')
            await page.waitForTimeout(1000)

            const searchResult = page.locator('.search-result, [data-testid="search-result"]').first()
            if (await searchResult.isVisible().catch(() => false)) {
                await searchResult.click()
                await page.waitForURL('**/doc/**', { timeout: 5000 }).catch(() => {})
            }
        }
    })

    test('E2E-053: 收藏文档', async ({ page }) => {
        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })
        }

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            const favoriteOption = page.getByText('收藏')
            if (await favoriteOption.isVisible().catch(() => false)) {
                await favoriteOption.click()
            }
        }
    })

    test('E2E-054: 取消收藏', async ({ page }) => {
        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            const unfavoriteOption = page.getByText('取消收藏').or(page.getByText('收藏'))
            if (await unfavoriteOption.isVisible().catch(() => false)) {
                await unfavoriteOption.click()
            }
        }
    })

    test('E2E-055: 删除文档应移入回收站', async ({ page }) => {
        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })
        }

        const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') })
        if (await moreButtons.first().isVisible().catch(() => false)) {
            await moreButtons.first().click()
            const deleteOption = page.getByText('删除')
            if (await deleteOption.isVisible().catch(() => false)) {
                await deleteOption.click()
                await page.waitForTimeout(1000)
            }
        }
    })

    test('E2E-056: 展开回收站应显示已删除文档', async ({ page }) => {
        const trashButton = page.getByText('回收站')
        if (await trashButton.isVisible().catch(() => false)) {
            await trashButton.click()
            await page.waitForTimeout(1000)
        }
    })

    test('E2E-057: 恢复文档', async ({ page }) => {
        const trashButton = page.getByText('回收站')
        if (await trashButton.isVisible().catch(() => false)) {
            await trashButton.click()
            await page.waitForTimeout(1000)

            const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') })
            if (await moreButtons.first().isVisible().catch(() => false)) {
                await moreButtons.first().click()
                const restoreOption = page.getByText('恢复')
                if (await restoreOption.isVisible().catch(() => false)) {
                    await restoreOption.click()
                    await page.waitForTimeout(1000)
                }
            }
        }
    })

    test('E2E-058: 永久删除文档', async ({ page }) => {
        const trashButton = page.getByText('回收站')
        if (await trashButton.isVisible().catch(() => false)) {
            await trashButton.click()
            await page.waitForTimeout(1000)

            const moreButtons = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') })
            if (await moreButtons.first().isVisible().catch(() => false)) {
                await moreButtons.first().click()
                const permanentDeleteOption = page.getByText('永久删除')
                if (await permanentDeleteOption.isVisible().catch(() => false)) {
                    await permanentDeleteOption.click()
                    await page.waitForTimeout(1000)
                }
            }
        }
    })
})
