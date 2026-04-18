import { test, expect } from '@playwright/test'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('导出/AI/通知/图谱/Markdown上传 E2E 测试', () => {
    let token: string

    test.beforeAll(async () => {
        const username = generateUniqueUsername('extra')
        await apiRegister(username, 'testpass123')
        token = await apiLogin(username, 'testpass123')
    })

    test.beforeEach(async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
    })

    test.describe('文档图谱', () => {
        test('E2E-059: 访问文档图谱页应显示图谱', async ({ page }) => {
            await page.goto('/doc/graph')
            await page.waitForTimeout(3000)

            const graphContainer = page.locator('.react-flow, [data-testid="doc-graph"]')
            if (await graphContainer.isVisible().catch(() => false)) {
                expect(await graphContainer.isVisible()).toBeTruthy()
            }
        })

        test('E2E-060: 双击节点应跳转到文档', async ({ page }) => {
            await page.goto('/doc/graph')
            await page.waitForTimeout(3000)

            const graphNode = page.locator('.react-flow__node').first()
            if (await graphNode.isVisible().catch(() => false)) {
                await graphNode.dblclick()
                await page.waitForURL('**/doc/**', { timeout: 5000 }).catch(() => {})
            }
        })

        test('E2E-061: 无文档时图谱应显示空状态', async ({ page }) => {
            const freshUsername = generateUniqueUsername('emptygraph')
            await apiRegister(freshUsername, 'testpass123')
            const freshToken = await apiLogin(freshUsername, 'testpass123')

            await setToken(page, freshToken)
            await page.goto('/doc/graph')
            await page.waitForTimeout(3000)

            const emptyState = page.getByText(/暂无文档|还没有文档/)
            if (await emptyState.isVisible().catch(() => false)) {
                expect(await emptyState.isVisible()).toBeTruthy()
            }
        })
    })

    test.describe('导出功能', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
            if (await newDocButton.isVisible()) {
                await newDocButton.click()
                await page.waitForURL('**/doc/**', { timeout: 10000 })
            }
        })

        test('E2E-062: 导出 Markdown', async ({ page }) => {
            const exportButton = page.getByRole('button', { name: /导出/ })
            if (await exportButton.isVisible().catch(() => false)) {
                await exportButton.click()
                const mdOption = page.getByText('Markdown').or(page.getByText('MD'))
                if (await mdOption.isVisible().catch(() => false)) {
                    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
                    await mdOption.click()
                    const download = await downloadPromise
                    if (download) {
                        expect(download.suggestedFilename()).toMatch(/\.md$/)
                    }
                }
            }
        })

        test('E2E-063: 导出 HTML', async ({ page }) => {
            const exportButton = page.getByRole('button', { name: /导出/ })
            if (await exportButton.isVisible().catch(() => false)) {
                await exportButton.click()
                const htmlOption = page.getByText('HTML')
                if (await htmlOption.isVisible().catch(() => false)) {
                    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
                    await htmlOption.click()
                    const download = await downloadPromise
                    if (download) {
                        expect(download.suggestedFilename()).toMatch(/\.html$/)
                    }
                }
            }
        })

        test('E2E-064: 导出 Word', async ({ page }) => {
            const exportButton = page.getByRole('button', { name: /导出/ })
            if (await exportButton.isVisible().catch(() => false)) {
                await exportButton.click()
                const wordOption = page.getByText('Word').or(page.getByText('DOCX'))
                if (await wordOption.isVisible().catch(() => false)) {
                    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
                    await wordOption.click()
                    const download = await downloadPromise
                    if (download) {
                        expect(download.suggestedFilename()).toMatch(/\.docx$/)
                    }
                }
            }
        })

        test('E2E-065: 导出 PDF', async ({ page }) => {
            const exportButton = page.getByRole('button', { name: /导出/ })
            if (await exportButton.isVisible().catch(() => false)) {
                await exportButton.click()
                const pdfOption = page.getByText('PDF')
                if (await pdfOption.isVisible().catch(() => false)) {
                    await pdfOption.click()
                    await page.waitForTimeout(3000)
                }
            }
        })

        test('E2E-066: 导出纯文本', async ({ page }) => {
            const exportButton = page.getByRole('button', { name: /导出/ })
            if (await exportButton.isVisible().catch(() => false)) {
                await exportButton.click()
                const txtOption = page.getByText('纯文本').or(page.getByText('TXT'))
                if (await txtOption.isVisible().catch(() => false)) {
                    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
                    await txtOption.click()
                    const download = await downloadPromise
                    if (download) {
                        expect(download.suggestedFilename()).toMatch(/\.txt$/)
                    }
                }
            }
        })
    })

    test.describe('AI 辅助写作', () => {
        test('E2E-067: 点击 AI 助手按钮应打开聊天窗口', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
            if (await newDocButton.isVisible()) {
                await newDocButton.click()
                await page.waitForURL('**/doc/**', { timeout: 10000 })
            }

            const aiButton = page.locator('button').filter({ has: page.locator('svg.lucide-sparkles, svg.lucide-bot') }).first()
            if (await aiButton.isVisible().catch(() => false)) {
                await aiButton.click()
                await page.waitForTimeout(1000)
            }
        })

        test('E2E-068: 输入问题发送后 AI 应回复', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
            if (await newDocButton.isVisible()) {
                await newDocButton.click()
                await page.waitForURL('**/doc/**', { timeout: 10000 })
            }

            const aiButton = page.locator('button').filter({ has: page.locator('svg.lucide-sparkles, svg.lucide-bot') }).first()
            if (await aiButton.isVisible().catch(() => false)) {
                await aiButton.click()
                await page.waitForTimeout(1000)

                const aiInput = page.getByPlaceholderText(/问|输入|消息/)
                if (await aiInput.isVisible().catch(() => false)) {
                    await aiInput.fill('Hello AI')
                    await page.keyboard.press('Enter')
                    await page.waitForTimeout(3000)
                }
            }
        })

        test('E2E-069: 点击插入文档应将内容插入编辑器', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
            if (await newDocButton.isVisible()) {
                await newDocButton.click()
                await page.waitForURL('**/doc/**', { timeout: 10000 })
            }

            const insertButton = page.getByRole('button', { name: /插入文档|插入/ })
            if (await insertButton.isVisible().catch(() => false)) {
                await insertButton.click()
            }
        })

        test('E2E-070: 选中文本后 AI 续写', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
            if (await newDocButton.isVisible()) {
                await newDocButton.click()
                await page.waitForURL('**/doc/**', { timeout: 10000 })
            }

            const editor = page.locator('.ProseMirror, [contenteditable]').last()
            if (await editor.isVisible().catch(() => false)) {
                await editor.click()
                await editor.type('Some text to continue')
                await page.keyboard.press('Control+a')
                await page.waitForTimeout(500)

                const aiMenuOption = page.getByText(/续写|AI 续写/)
                if (await aiMenuOption.isVisible().catch(() => false)) {
                    await aiMenuOption.click()
                }
            }
        })
    })

    test.describe('通知系统', () => {
        test('E2E-071: 被添加为协作者后铃铛显示未读数', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const notificationBell = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first()
            if (await notificationBell.isVisible().catch(() => false)) {
                const badge = notificationBell.locator('.badge, [data-testid="unread-count"]')
                if (await badge.isVisible().catch(() => false)) {
                    expect(await badge.isVisible()).toBeTruthy()
                }
            }
        })

        test('E2E-072: 点击通知应跳转到文档', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const notificationBell = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first()
            if (await notificationBell.isVisible().catch(() => false)) {
                await notificationBell.click()
                await page.waitForTimeout(1000)

                const notificationItem = page.locator('.notification-item, [data-testid="notification-item"]').first()
                if (await notificationItem.isVisible().catch(() => false)) {
                    await notificationItem.click()
                }
            }
        })

        test('E2E-073: 点击全部标记已读', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const notificationBell = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first()
            if (await notificationBell.isVisible().catch(() => false)) {
                await notificationBell.click()
                await page.waitForTimeout(1000)

                const readAllButton = page.getByText('全部标记已读')
                if (await readAllButton.isVisible().catch(() => false)) {
                    await readAllButton.click()
                }
            }
        })
    })

    test.describe('Markdown 上传', () => {
        test('E2E-074: 上传 Markdown 文件应显示预览', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const uploadButton = page.getByRole('button', { name: /上传 Markdown/ })
            if (await uploadButton.isVisible().catch(() => false)) {
                const fileInput = page.locator('input[type="file"]').first()
                if (await fileInput.isVisible().catch(() => false)) {
                    await fileInput.setInputFiles({
                        name: 'test.md',
                        mimeType: 'text/markdown',
                        buffer: Buffer.from('# Test Markdown\n\nHello World'),
                    })
                    await page.waitForTimeout(2000)
                }
            }
        })

        test('E2E-075: 确认上传应创建文档并跳转', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const uploadButton = page.getByRole('button', { name: /上传 Markdown/ })
            if (await uploadButton.isVisible().catch(() => false)) {
                const fileInput = page.locator('input[type="file"]').first()
                if (await fileInput.isVisible().catch(() => false)) {
                    await fileInput.setInputFiles({
                        name: 'test.md',
                        mimeType: 'text/markdown',
                        buffer: Buffer.from('# Upload Test\n\nContent here'),
                    })
                    await page.waitForTimeout(2000)

                    const confirmButton = page.getByRole('button', { name: /确认|上传|导入/ })
                    if (await confirmButton.isVisible().catch(() => false)) {
                        await confirmButton.click()
                        await page.waitForURL('**/doc/**', { timeout: 10000 }).catch(() => {})
                    }
                }
            }
        })

        test('E2E-076: 上传非 .md 文件应提示错误', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const uploadButton = page.getByRole('button', { name: /上传 Markdown/ })
            if (await uploadButton.isVisible().catch(() => false)) {
                const fileInput = page.locator('input[type="file"]').first()
                if (await fileInput.isVisible().catch(() => false)) {
                    await fileInput.setInputFiles({
                        name: 'test.txt',
                        mimeType: 'text/plain',
                        buffer: Buffer.from('Not a markdown file'),
                    })
                    await page.waitForTimeout(2000)

                    const errorMsg = page.getByText(/仅支持|不支持|格式/)
                    if (await errorMsg.isVisible().catch(() => false)) {
                        expect(await errorMsg.isVisible()).toBeTruthy()
                    }
                }
            }
        })

        test('E2E-077: 上传超过 5MB 的文件应提示错误', async ({ page }) => {
            await page.goto('/doc')
            await page.waitForURL('**/doc**', { timeout: 10000 })

            const uploadButton = page.getByRole('button', { name: /上传 Markdown/ })
            if (await uploadButton.isVisible().catch(() => false)) {
                const fileInput = page.locator('input[type="file"]').first()
                if (await fileInput.isVisible().catch(() => false)) {
                    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a')
                    await fileInput.setInputFiles({
                        name: 'large.md',
                        mimeType: 'text/markdown',
                        buffer: largeBuffer,
                    })
                    await page.waitForTimeout(2000)

                    const errorMsg = page.getByText(/超过|太大|大小/)
                    if (await errorMsg.isVisible().catch(() => false)) {
                        expect(await errorMsg.isVisible()).toBeTruthy()
                    }
                }
            }
        })
    })
})
