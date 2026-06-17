import { useDroppable } from '@dnd-kit/core'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import type { ReactNode } from 'react'

interface DroppableFolderItemProps {
    folderId: string
    children: ReactNode
}

export function DroppableFolderItem({ folderId, children }: DroppableFolderItemProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folderId}`,
        data: { type: 'folder' },
    })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'rounded-md transition-colors',
                isOver && 'bg-sidebar-accent/50 ring-1 ring-sidebar-accent ring-inset'
            )}
        >
            {children}
        </div>
    )
}
