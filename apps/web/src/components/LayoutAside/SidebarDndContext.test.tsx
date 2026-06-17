import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { mockAuthenticatedUser } from '@/test/helpers'

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
    useDroppable: () => ({ isOver: false, setNodeRef: vi.fn() }),
    PointerSensor: vi.fn(),
    useSensor: () => vi.fn(),
    useSensors: () => [],
}))

vi.mock('@/services', () => ({
    updatePage: vi.fn().mockResolvedValue({ data: { pageId: 'page1' }, success: true }),
}))

vi.mock('@/utils/query-client', () => ({
    queryClient: {
        invalidateQueries: vi.fn(),
    },
}))

import { SidebarDndContext } from './SidebarDndContext'

describe('SidebarDndContext', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    it('should render children inside DndContext', () => {
        render(
            <SidebarDndContext>
                <div data-testid="child">Test Content</div>
            </SidebarDndContext>
        )
        expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
        expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should render DragOverlay', () => {
        render(
            <SidebarDndContext>
                <div>Content</div>
            </SidebarDndContext>
        )
        expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
    })
})
