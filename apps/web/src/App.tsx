import './App.css'
import '@lcw-doc/shadcn/style.css'

import { Toaster } from '@lcw-doc/shadcn-shared-ui/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { setDefaultOptions } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { router } from './router'
import { queryClient } from './utils/query-client'

setDefaultOptions({ locale: zhCN })

function applyInitialTheme() {
    const stored = localStorage.getItem('lcwdoc-theme') as 'light' | 'dark' | 'system' | null
    const theme = stored || 'light'
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

applyInitialTheme()

function App() {
    useEffect(() => {
        const stored = localStorage.getItem('lcwdoc-theme')
        if (stored !== 'system' && stored !== null) return
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => {
            const current = localStorage.getItem('lcwdoc-theme') as 'light' | 'dark' | 'system' | null
            if (current === 'system' || current === null) {
                if (mql.matches) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
        }
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <Toaster />
            <RouterProvider router={router} />
        </QueryClientProvider>
    )
}

export default App
