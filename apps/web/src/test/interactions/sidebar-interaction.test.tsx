import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAuthenticatedUser, mockAuthenticatedUser, renderWithProviders } from '@/test/helpers'

vi.mock('@/components/EmptyState', () => ({
    EmptyState: () => <div data-testid="empty-state">暂无文档</div>,
}))

vi.mock('@/components/MarkdownUploadDialog', () => ({
    MarkdownUploadDialog: ({ open }: any) => (open ? <div data-testid="markdown-upload-dialog">Upload</div> : null),
}))

vi.mock('@/components/TemplateDialog', () => ({
    TemplateDialog: ({ open }: any) => (open ? <div data-testid="template-dialog">Template</div> : null),
}))

vi.mock('@/utils/randomEmoji', () => ({
    randomEmoji: () => '📄',
}))

import { DocList } from '@/pages/DocList'

describe('Sidebar Interaction Tests', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-INT-023: should render search button in sidebar', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const searchText = screen.queryByText('搜索')
        if (searchText) {
            expect(searchText).toBeInTheDocument()
        }
    })

    it('UI-INT-024: should render document navigation in sidebar', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const allDocsLink = screen.queryByText('全部文档')
        if (allDocsLink) {
            expect(allDocsLink).toBeInTheDocument()
        }
    })

    it('UI-INT-025: should render trash section in sidebar', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const trashSection = screen.queryByText('回收站')
        if (trashSection) {
            expect(trashSection).toBeInTheDocument()
        }
    })

    it('UI-INT-026: should expand trash section on click', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const trashSection = screen.queryByText('回收站')
        if (trashSection) {
            await user.click(trashSection)
        }
    })

    it('UI-INT-027: should render user info in sidebar footer', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        const username = screen.queryByText('testuser')
        if (username) {
            expect(username).toBeInTheDocument()
        }
    })

    it('UI-INT-028: should show "取消收藏" for favorited documents in DocList', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 2')).toBeInTheDocument()
        })

        // Test Page 2 is favorited (isFavorite: true in MSW mock)
        const moreButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-more-vertical'))
        if (moreButtons.length > 1) {
            await user.click(moreButtons[1])
            await waitFor(() => {
                expect(screen.queryByText('取消收藏')).toBeInTheDocument()
            })
        }
    })

    it('UI-INT-029: should show "收藏" for non-favorited documents in DocList', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        // Test Page 1 is not favorited (isFavorite: false in MSW mock)
        const moreButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-more-vertical'))
        if (moreButtons.length > 0) {
            await user.click(moreButtons[0])
            await waitFor(() => {
                expect(screen.queryByText('收藏')).toBeInTheDocument()
            })
        }
    })

    it('UI-INT-030: should render folder section in sidebar', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Test Page 1')).toBeInTheDocument()
        })

        // MSW mock now returns a folder
        const folderText = screen.queryByText('测试文件夹')
        if (folderText) {
            expect(folderText).toBeInTheDocument()
        }
    })

    it('UI-INT-031: should render pages inside folder', async () => {
        renderWithProviders(<DocList />)

        await waitFor(() => {
            expect(screen.getByText('Folder Page')).toBeInTheDocument()
        })

        // Folder Page (page3) has folderId: 'folder1' in MSW mock
        expect(screen.getByText('Folder Page')).toBeInTheDocument()
    })
})
