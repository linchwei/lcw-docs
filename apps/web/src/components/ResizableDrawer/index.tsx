/**
 * 可调整宽度的抽屉组件
 *
 * 基于 shadcn Sheet 组件，从右侧滑出，支持拖拽调整宽度。
 * 默认宽度 50vw，最小 400px，最大 90vw。
 * 宽度持久化到 localStorage。
 *
 * @module components/ResizableDrawer
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetOverlay, SheetPortal } from '@lcw-doc/shadcn-shared-ui/components/ui/sheet'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'

const STORAGE_KEY_PREFIX = 'lcwdoc-drawer-width'
const DEFAULT_WIDTH = '50vw'
const MIN_WIDTH = 400
const MAX_WIDTH_RATIO = 0.9

interface ResizableDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    title?: string
    icon?: React.ReactNode
    storageKey?: string
}

export function ResizableDrawer({ open, onOpenChange, children, title, icon, storageKey = 'default' }: ResizableDrawerProps) {
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${storageKey}`)
        return saved || DEFAULT_WIDTH
    })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartX = useRef(0)
    const dragStartWidth = useRef(0)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        dragStartX.current = e.clientX
        const currentWidth = document.querySelector('[data-drawer-content]')?.getBoundingClientRect().width
        dragStartWidth.current = currentWidth || window.innerWidth * 0.5
    }, [])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX
            const maxWidth = window.innerWidth * MAX_WIDTH_RATIO
            const clampedWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, newWidth))
            setWidth(`${clampedWidth}px`)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            localStorage.setItem(`${STORAGE_KEY_PREFIX}-${storageKey}`, width)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isDragging, storageKey, width])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetPortal>
                <SheetOverlay className="bg-black/40" />
                <SheetContent
                    side="right"
                    data-drawer-content
                    className="flex flex-col gap-0 p-0 rounded-tl-lg shadow-2xl border-l border-zinc-200"
                    style={{ width, maxWidth: 'none' }}
                    // 覆盖 Sheet 默认的 sm:max-w-sm
                    onPointerDownOutside={e => {
                        // 允许拖拽手柄交互
                        if (isDragging) e.preventDefault()
                    }}
                >
                    {/* 拖拽手柄 */}
                    <div
                        onMouseDown={handleMouseDown}
                        className={cn(
                            'absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-colors duration-150 z-10',
                            isDragging ? 'bg-brand/30' : 'bg-transparent hover:bg-brand/20'
                        )}
                    />

                    {/* 头部 */}
                    <SheetHeader className="flex flex-row items-center h-12 px-4 border-b border-zinc-100 space-y-0">
                        <div className="flex items-center gap-2">
                            {icon}
                            {title && <SheetTitle className="font-medium text-sm text-foreground">{title}</SheetTitle>}
                        </div>
                    </SheetHeader>

                    {/* 内容区 */}
                    <div className="flex-1 overflow-hidden">{children}</div>
                </SheetContent>
            </SheetPortal>
        </Sheet>
    )
}
