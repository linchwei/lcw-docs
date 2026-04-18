import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

function getStoredTheme(): Theme {
    return (localStorage.getItem('lcwdoc-theme') as Theme) || 'system'
}

function setStoredTheme(theme: Theme) {
    localStorage.setItem('lcwdoc-theme', theme)
}

const themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
    { value: 'system', label: '跟随系统' },
]

interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    username?: string
}

export function SettingsDialog({ open, onOpenChange, username }: SettingsDialogProps) {
    const [theme, setTheme] = useState<Theme>(getStoredTheme)

    useEffect(() => {
        applyTheme(theme)
        setStoredTheme(theme)
    }, [theme])

    useEffect(() => {
        if (theme !== 'system') return
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme('system')
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [theme])

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
                    <Dialog.Title className="sr-only">设置</Dialog.Title>
                    <Dialog.Description className="sr-only">应用设置面板</Dialog.Description>

                    <h2 className="text-lg font-semibold mb-6 text-[#37352f]">设置</h2>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center py-3 border-b border-[#e9e9e7]">
                                <span className="text-sm text-[#787774]">用户名</span>
                                <span className="text-sm font-medium text-[#37352f]">{username ?? '—'}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center py-3 border-b border-[#e9e9e7]">
                                <span className="text-sm text-[#787774]">语言设置</span>
                                <span className="text-sm font-medium text-[#37352f]">中文</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-[#e9e9e7]">
                                <span className="text-sm text-[#787774]">主题</span>
                                <div className="flex rounded-lg overflow-hidden border border-[#e9e9e7]">
                                    {themeOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setTheme(option.value)}
                                            className={`px-3 py-1 text-xs transition-colors ${
                                                theme === option.value
                                                    ? 'bg-[#37352f] text-white'
                                                    : 'bg-white text-[#787774] hover:bg-[#f5f5f4]'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
