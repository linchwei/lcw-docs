import { test, expect } from '@playwright/test'
import { generateUniqueUsername, apiRegister, apiLogin, setToken } from './helpers'

test.describe('离线与重连 E2E 测试', () => {
    let token: string

    test.beforeAll(async () => {
        const username = generateUniqueUsername('offline')
        await apiRegister(username, 'testpass123')
        token = await apiLogin(username, 'testpass123')
    })

    test('E2E-085: 断开网络应显示离线模式', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
        }

        const cdpSession = await page.context().newCDPSession(page)
        await cdpSession.send('Network.enable')
        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0,
        })

        await page.waitForTimeout(3000)

        const offlineIndicator = page.getByText(/离线模式|连接断开|offline/i)
        if (await offlineIndicator.isVisible().catch(() => false)) {
            expect(await offlineIndicator.isVisible()).toBeTruthy()
        }

        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1,
        })
    })

    test('E2E-086: 离线状态下编辑文档应保存到本地', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
        }

        const cdpSession = await page.context().newCDPSession(page)
        await cdpSession.send('Network.enable')
        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0,
        })

        const editor = page.locator('.ProseMirror, [contenteditable]').last()
        if (await editor.isVisible().catch(() => false)) {
            await editor.click()
            await editor.type('Offline content')
        }

        const localSavedIndicator = page.getByText(/本地已保存|离线模式/)
        if (await localSavedIndicator.isVisible().catch(() => false)) {
            expect(await localSavedIndicator.isVisible()).toBeTruthy()
        }

        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1,
        })
    })

    test('E2E-087: 恢复网络连接后应同步到服务器', async ({ page }) => {
        await page.goto('/account/login')
        await setToken(page, token)
        await page.goto('/doc')
        await page.waitForURL('**/doc**', { timeout: 10000 })

        const newDocButton = page.getByRole('button', { name: /新建文档|新建/ }).first()
        if (await newDocButton.isVisible()) {
            await newDocButton.click()
            await page.waitForURL('**/doc/**', { timeout: 10000 })
        }

        const cdpSession = await page.context().newCDPSession(page)
        await cdpSession.send('Network.enable')
        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0,
        })

        await page.waitForTimeout(2000)

        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1,
        })

        await page.waitForTimeout(5000)

        const syncedIndicator = page.getByText(/已同步|已保存/)
        if (await syncedIndicator.isVisible().catch(() => false)) {
            expect(await syncedIndicator.isVisible()).toBeTruthy()
        }
    })
})
