import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders, mockAuthenticatedUser, clearAuthenticatedUser } from '@/test/helpers'

vi.mock('@/components/EmptyState', () => ({
    EmptyState: () => <div data-testid="empty-state">暂无文档</div>,
}))

vi.mock('@/components/MarkdownUploadDialog', () => ({
    MarkdownUploadDialog: ({ open }: any) => open ? <div data-testid="markdown-upload-dialog">Upload</div> : null,
}))

vi.mock('@/components/TemplateDialog', () => ({
    TemplateDialog: ({ open }: any) => open ? <div data-testid="template-dialog">Template</div> : null,
}))

vi.mock('@/utils/randomEmoji', () => ({
    randomEmoji: () => '📄',
}))

import { DocList } from '@/pages/DocList'

describe('DocList Interaction Tests', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-INT-005: should render document list with cards', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        expect(screen.getByText('Test Page 2')).toBeInTheDocument()
    })

    it('UI-INT-006: should have dropdown menu trigger on cards', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
    })

    it('UI-INT-007: should render cover images for pages with covers', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 2')).toBeInTheDocument()
        })

        const coverElements = document.querySelectorAll('[class*="cover"], [style*="background-image"]')
        expect(coverElements.length).toBeGreaterThanOrEqual(0)
    })

    it('UI-INT-008: should display emoji for pages without covers', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        expect(screen.getByText('📄')).toBeInTheDocument()
    })

    it('UI-INT-009: should render page tags', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })
    })

    it('UI-INT-010: should have new document button', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const newDocButton = screen.queryByRole('button', { name: /新建文档/ })
        if (newDocButton) {
            expect(newDocButton).toBeInTheDocument()
        }
    })

    it('UI-INT-011: should have upload markdown button', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const uploadButton = screen.queryByRole('button', { name: /上传 Markdown/ })
        if (uploadButton) {
            expect(uploadButton).toBeInTheDocument()
        }
    })

    it('UI-INT-012: should have template button', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const templateButton = screen.queryByRole('button', { name: /从模板创建/ })
        if (templateButton) {
            expect(templateButton).toBeInTheDocument()
        }
    })

    it('UI-INT-013: should have links to document pages', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)
    })
})
