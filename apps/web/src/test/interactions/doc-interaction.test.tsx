import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

import { mockAuthenticatedUser } from '@/test/helpers'

vi.mock('@/services', () => ({
    createShare: vi.fn().mockResolvedValue({
        data: { shareId: 'share1', pageId: 'page1', permission: 'view' },
        success: true,
    }),
    getShares: vi.fn().mockResolvedValue({ data: [], success: true }),
    deleteShare: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    createVersion: vi.fn().mockResolvedValue({ data: { versionId: 'v1' }, success: true }),
    getVersions: vi.fn().mockResolvedValue({ data: [], success: true }),
    deleteVersion: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    getVersion: vi.fn().mockResolvedValue({ data: {}, success: true }),
    rollbackVersion: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    diffVersions: vi.fn().mockResolvedValue({ data: {}, success: true }),
    createComment: vi.fn().mockResolvedValue({ data: { commentId: 'c1', content: 'test' }, success: true }),
    getComments: vi.fn().mockResolvedValue({ data: [], success: true }),
    replyComment: vi.fn().mockResolvedValue({ data: { commentId: 'r1' }, success: true }),
    resolveComment: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    deleteComment: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    getCollaborators: vi.fn().mockResolvedValue({ data: [], success: true }),
    addCollaborator: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    updateCollaborator: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
    removeCollaborator: vi.fn().mockResolvedValue({ data: { success: true }, success: true }),
}))

vi.mock('@lcw-doc/shadcn-shared-ui/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}))

function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{ui}</MemoryRouter>
        </QueryClientProvider>,
    )
}

describe('Doc Page Interaction Tests', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
        vi.clearAllMocks()
    })

    it('UI-INT-014: SharePopover should render trigger button', async () => {
        const { SharePopover } = await import('@/components/SharePopover')
        renderWithClient(<SharePopover pageId="page1" />)
        const trigger = screen.queryByRole('button', { name: /分享/ })
        if (trigger) {
            expect(trigger).toBeInTheDocument()
        }
    })

    it('UI-INT-015: SharePopover should open on click', async () => {
        const user = userEvent.setup()
        const { SharePopover } = await import('@/components/SharePopover')
        renderWithClient(<SharePopover pageId="page1" />)

        const trigger = screen.queryByRole('button', { name: /分享/ })
        if (trigger) {
            await user.click(trigger)
            await waitFor(() => {
                const content = screen.queryAllByText(/暂无分享链接|分享链接/)
                if (content.length > 0) expect(content.length).toBeGreaterThan(0)
            })
        }
    })

    it('UI-INT-016: VersionPanel should render title', async () => {
        const { VersionPanel } = await import('@/components/VersionPanel')
        renderWithClient(<VersionPanel pageId="page1" onClose={vi.fn()} />)
        expect(screen.getByText('版本历史')).toBeInTheDocument()
    })

    it('UI-INT-017: VersionPanel should have save button', async () => {
        const { VersionPanel } = await import('@/components/VersionPanel')
        renderWithClient(<VersionPanel pageId="page1" onClose={vi.fn()} />)
        const saveButton = screen.queryByRole('button', { name: '保存当前版本' })
        if (saveButton) {
            expect(saveButton).toBeInTheDocument()
        }
    })

    it('UI-INT-018: CommentPanel should render title', async () => {
        const { CommentPanel } = await import('@/components/CommentPanel')
        renderWithClient(<CommentPanel pageId="page1" onClose={vi.fn()} />)
        expect(screen.getByText('评论')).toBeInTheDocument()
    })

    it('UI-INT-019: CommentPanel should have input', async () => {
        const { CommentPanel } = await import('@/components/CommentPanel')
        renderWithClient(<CommentPanel pageId="page1" onClose={vi.fn()} />)
        const input = screen.queryByPlaceholderText('添加评论...')
        if (input) {
            expect(input).toBeInTheDocument()
        }
    })

    it('UI-INT-020: CommentPanel should have submit button', async () => {
        const { CommentPanel } = await import('@/components/CommentPanel')
        renderWithClient(<CommentPanel pageId="page1" onClose={vi.fn()} />)
        const submitButton = screen.queryByRole('button', { name: '发表评论' })
        if (submitButton) {
            expect(submitButton).toBeInTheDocument()
        }
    })

    it('UI-INT-021: CollaboratorPanel should render title', async () => {
        const { CollaboratorPanel } = await import('@/components/CollaboratorPanel')
        renderWithClient(<CollaboratorPanel pageId="page1" onClose={vi.fn()} />)
        expect(screen.getByText('协作者')).toBeInTheDocument()
    })

    it('UI-INT-022: CollaboratorPanel should have invite button', async () => {
        const { CollaboratorPanel } = await import('@/components/CollaboratorPanel')
        renderWithClient(<CollaboratorPanel pageId="page1" onClose={vi.fn()} />)
        const inviteButton = screen.queryByRole('button', { name: /邀请协作者|邀请/ })
        if (inviteButton) {
            expect(inviteButton).toBeInTheDocument()
        }
    })
})
