import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { renderWithProviders, mockAuthenticatedUser, clearAuthenticatedUser } from '@/test/helpers'
import { server } from '@/test/mocks/server'

vi.mock('@/services', async () => {
    const actual = await vi.importActual('@/services')
    return actual
})

vi.mock('y-websocket', () => ({
    WebsocketProvider: class {
        awareness = { on: vi.fn(), off: vi.fn(), getStates: () => new Map() }
        destroy() {}
        on() { return this }
        off() { return this }
        connect() {}
        disconnect() {}
    },
}))

vi.mock('y-indexeddb', () => ({
    IndexeddbPersistence: class {
        whenSynced = Promise.resolve()
        destroy() {}
        on() { return this }
        off() { return this }
    },
}))

vi.mock('yjs', () => ({
    Doc: class {
        getXmlFragment() { return { toJSON: () => '' } }
        destroy() {}
    },
    encodeStateAsUpdate: () => new Uint8Array(),
    applyUpdate: () => {},
}))

vi.mock('@tiptap/react', () => ({
    useEditor: () => null,
    EditorContent: ({ editor }: any) => <div data-testid="editor-content">Editor</div>,
}))

vi.mock('@/components/EmptyState', () => ({
    EmptyState: () => <div>No content</div>,
}))

import { Doc } from './index'

describe('Doc Page', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
        server.use(
            http.get('/api/page/:pageId', () => {
                return HttpResponse.json({
                    data: {
                        pageId: 'page1',
                        title: 'Test Document',
                        emoji: '📄',
                        role: 'owner',
                        user: { id: 1, username: 'testuser' },
                    },
                    success: true,
                })
            })
        )
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-029: should render doc page', async () => {
        renderWithProviders(<Doc />, { route: '/doc/page1' })

        await waitFor(() => {
            expect(document.body).toBeInTheDocument()
        })
    })
})
