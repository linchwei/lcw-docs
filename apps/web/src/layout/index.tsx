import { SidebarProvider } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { GlobalAIChat } from '@/components/GlobalAIChat'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { Aside } from '@/components/LayoutAside/Aside'
import { EditorProvider } from '@/context/EditorContext'

export function Layout() {
    const [shortcutsOpen, setShortcutsOpen] = useState(false)

    useLayoutEffect(() => {
        if (!localStorage.getItem('token')) {
            window.location.href = `/account/login?redirect=${window.location.pathname}`
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault()
                setShortcutsOpen(prev => !prev)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <EditorProvider>
            <SidebarProvider>
                <Aside />
                <Outlet />
                <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
            </SidebarProvider>
            <GlobalAIChat />
        </EditorProvider>
    )
}
