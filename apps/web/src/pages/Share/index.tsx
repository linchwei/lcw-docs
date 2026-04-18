import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { Eye, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { fetchShareInfo } from '@/services/share'

import { ShareDocEditor } from './ShareDocEditor'

const permissionLabels: Record<string, { label: string; icon: typeof Eye; className: string }> = {
    view: { label: '只读', icon: Eye, className: 'text-zinc-500 bg-zinc-100' },
    comment: { label: '可评论', icon: Eye, className: 'text-amber-600 bg-amber-50' },
    edit: { label: '可编辑', icon: PenLine, className: 'text-blue-600 bg-blue-50' },
}

export function SharePage() {
    const { shareId } = useParams()
    const [shareInfo, setShareInfo] = useState<any>(null)
    const [password, setPassword] = useState('')
    const [needPassword, setNeedPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        if (!shareId) return
        loadShareInfo()
    }, [shareId])

    const loadShareInfo = async (pwd?: string) => {
        try {
            setLoading(true)
            setError('')
            setPasswordError('')
            const res = await fetchShareInfo(shareId!, pwd)
            setShareInfo(res.data)
            setNeedPassword(false)
        } catch (err: any) {
            if (err?.response?.status === 401) {
                setNeedPassword(true)
                if (pwd) {
                    setPasswordError('密码错误，请重试')
                }
            } else if (err?.response?.status === 410) {
                setError('分享链接已过期')
            } else {
                setError('分享链接不存在或无效')
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = () => {
        loadShareInfo(password)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-zinc-500">加载中...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-zinc-700">{error}</p>
                    <p className="text-sm text-zinc-400 mt-2">请联系分享者获取新的链接</p>
                </div>
            </div>
        )
    }

    if (needPassword) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-80 text-center">
                    <h2 className="text-lg font-medium mb-4">此链接需要密码访问</h2>
                    <Input
                        type="password"
                        placeholder="请输入访问密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                        className="mb-3"
                    />
                    {passwordError && <p className="text-red-500 text-sm mb-3">{passwordError}</p>}
                    <Button onClick={handlePasswordSubmit} className="w-full">确认</Button>
                </div>
            </div>
        )
    }

    const permInfo = permissionLabels[shareInfo?.permission] || permissionLabels.view
    const PermIcon = permInfo.icon

    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
                <div className="max-w-[900px] mx-auto px-6 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-[#6B45FF] flex items-center justify-center">
                            <div className="w-3 h-3.5 rounded-[1px] bg-white/90" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700">{shareInfo?.title || '共享文档'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${permInfo.className}`}>
                            <PermIcon size={12} />
                            {permInfo.label}
                        </span>
                        {!localStorage.getItem('token') && shareInfo?.permission !== 'edit' && (
                            <Button size="sm" variant="outline" asChild>
                                <a href={`/account/login?redirect=/share/${shareId}`}>登录以协作</a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="max-w-[900px] mx-auto py-12 px-6">
                <div className="prose max-w-none">
                    {shareInfo?.pageId && (
                        <ShareDocEditor
                            pageId={shareInfo.pageId}
                            shareId={shareId!}
                            password={password || undefined}
                            permission={shareInfo.permission}
                        />
                    )}
                </div>
                <div className="text-center text-xs text-zinc-400 mt-12 pb-8">
                    由 LcwDoc 提供支持
                </div>
            </div>
        </div>
    )
}
