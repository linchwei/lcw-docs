import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
    useDroppable: () => ({
        isOver: false,
        setNodeRef: vi.fn(),
    }),
}))

vi.mock('@lcw-doc/shadcn-shared-ui/lib/utils', () => ({
    cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

import { DroppableFolderItem } from './DroppableFolderItem'

describe('DroppableFolderItem', () => {
    it('should render children', () => {
        render(
            <DroppableFolderItem folderId="folder1">
                <div data-testid="child">Folder Item</div>
            </DroppableFolderItem>
        )
        expect(screen.getByTestId('child')).toBeInTheDocument()
        expect(screen.getByText('Folder Item')).toBeInTheDocument()
    })

    it('should have rounded-md class', () => {
        const { container } = render(
            <DroppableFolderItem folderId="folder1">
                <div>Content</div>
            </DroppableFolderItem>
        )
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper.className).toContain('rounded-md')
    })
})
