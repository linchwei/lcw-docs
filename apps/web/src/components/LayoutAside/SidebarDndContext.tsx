import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import * as srv from '@/services'
import { queryClient } from '@/utils/query-client'

interface SidebarDndContextValue {
    activeId: string | null
    isOverRoot: boolean
}

const SidebarDndCtx = createContext<SidebarDndContextValue>({ activeId: null, isOverRoot: false })

export function useSidebarDnd() {
    return useContext(SidebarDndCtx)
}

interface SidebarDndContextProps {
    children: ReactNode
}

export function SidebarDndContext({ children }: SidebarDndContextProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const { toast } = useToast()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const { isOver, setNodeRef: setRootRef } = useDroppable({ id: 'root-area' })

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id))
    }, [])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || !active) return

        // 仅处理页面类型的拖拽
        if (active.data.current?.type !== 'page') return

        const pageId = String(active.id)
        const overId = String(over.id)

        let targetFolderId: string | null = null
        if (overId.startsWith('folder-')) {
            targetFolderId = overId.replace('folder-', '')
        } else if (overId !== 'root-area') {
            return
        }

        try {
            await srv.updatePage({ pageId, folderId: targetFolderId })
            queryClient.invalidateQueries({ queryKey: ['pages'] })
            queryClient.invalidateQueries({ queryKey: ['folders'] })
        } catch (error) {
            console.error('Failed to move page:', error)
            toast({ title: '移动文档失败', variant: 'destructive' })
        }
    }, [queryClient, toast])

    const handleDragCancel = useCallback(() => {
        setActiveId(null)
    }, [])

    return (
        <SidebarDndCtx.Provider value={{ activeId, isOverRoot: isOver }}>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <div ref={setRootRef} className="flex-1">
                    {children}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-sidebar-accent text-sidebar-accent-foreground px-3 py-1.5 rounded-md text-sm shadow-lg opacity-80">
                            移动文档...
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </SidebarDndCtx.Provider>
    )
}
