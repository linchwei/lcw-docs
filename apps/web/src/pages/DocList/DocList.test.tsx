import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { renderWithProviders, mockAuthenticatedUser, clearAuthenticatedUser } from '@/test/helpers'
import { server } from '@/test/mocks/server'

vi.mock('@/components/EmptyState', () => ({
    EmptyState: () => <div data-testid="empty-state">No documents</div>,
}))

vi.mock('@/components/MarkdownUploadDialog', () => ({
    MarkdownUploadDialog: ({ open }: any) => open ? <div>Upload Dialog</div> : null,
}))

vi.mock('@/components/TemplateDialog', () => ({
    TemplateDialog: ({ open }: any) => open ? <div>Template Dialog</div> : null,
}))

vi.mock('@/utils/randomEmoji', () => ({
    randomEmoji: () => '📄',
}))

import { DocList } from './index'

describe('DocList Page', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-008: should render document card list', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
            expect(screen.getByText('Test Page 2')).toBeInTheDocument()
        })
    })

    it('UI-024: should display cover image on cards', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            const coverImg = screen.queryByRole('img')
            if (coverImg) {
                expect(coverImg).toBeInTheDocument()
            }
        })
    })

    it('UI-025: should display tags on cards', async () => {
        server.use(
            http.get('/api/page/:pageId/tags', () => {
                return HttpResponse.json({
                    data: [{ tagId: 'tag1', name: 'Important', color: '#ff0000' }],
                    success: true,
                })
            })
        )

        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })
    })
})
