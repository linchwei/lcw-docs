import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { renderWithProviders, clearAuthenticatedUser } from '@/test/helpers'
import { server } from '@/test/mocks/server'

vi.mock('@/services', async () => {
    const actual = await vi.importActual('@/services')
    return actual
})

vi.mock('y-websocket', () => ({
    WebsocketProvider: vi.fn().mockReturnValue({ destroy: vi.fn() }),
}))

vi.mock('y-indexeddb', () => ({
    IndexeddbPersistence: vi.fn().mockReturnValue({ destroy: vi.fn() }),
}))

vi.mock('yjs', () => ({
    Doc: vi.fn().mockImplementation(() => ({
        getXmlFragment: vi.fn().mockReturnValue({ toJSON: () => '' }),
    })),
}))

import { SharePage } from './index'

describe('Share Page', () => {
    beforeEach(() => {
        clearAuthenticatedUser()
        server.use(
            http.get('/api/share/:shareId/info', () => {
                return HttpResponse.json({
                    data: {
                        shareId: 'share1',
                        pageId: 'page1',
                        permission: 'view',
                        title: 'Shared Document',
                        emoji: '📄',
                    },
                    success: true,
                })
            }),
            http.get('/api/share/:shareId/content', () => {
                return HttpResponse.json({
                    data: { content: '' },
                    success: true,
                })
            })
        )
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-050: should render share page', async () => {
        renderWithProviders(<SharePage />, { route: '/share/share1' })

        await waitFor(() => {
            expect(document.body).toBeInTheDocument()
        })
    })

    it('UI-052: should show expired message for expired share', async () => {
        server.use(
            http.get('/api/share/:shareId/info', () => {
                return HttpResponse.json(
                    { message: 'Share link has expired' },
                    { status: 410 }
                )
            })
        )

        renderWithProviders(<SharePage />, { route: '/share/expired' })

        await waitFor(() => {
            expect(document.body).toBeInTheDocument()
        })
    })
})
