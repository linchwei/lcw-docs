import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: { role: 'button', tabIndex: 0 },
        listeners: { onPointerDown: vi.fn() },
        setNodeRef: vi.fn(),
        transform: null,
        transition: undefined,
        isDragging: false,
    }),
}))

vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: () => null,
        },
    },
}))

import { SortablePageItem } from './SortablePageItem'

describe('SortablePageItem', () => {
    it('should render children', () => {
        render(
            <SortablePageItem id="page1">
                <div data-testid="child">Page Item</div>
            </SortablePageItem>
        )
        expect(screen.getByTestId('child')).toBeInTheDocument()
        expect(screen.getByText('Page Item')).toBeInTheDocument()
    })
})
