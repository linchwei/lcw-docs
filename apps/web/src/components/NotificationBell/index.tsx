import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@lcw-doc/shadcn-shared-ui/components/ui/popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, MessageCircle, Share2, Trash2, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'
import { Notification } from '@/types/api'

export function NotificationBell() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data: unreadData } = useQuery({
        queryKey: ['notification-unread-count'],
        queryFn: async () => {
            const res = await srv.fetchUnreadCount()
            return res.data
        },
        refetchInterval: 30000,
    })

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await srv.fetchNotifications()
            return res.data || []
        },
    })

    const markReadMutation = useMutation({
        mutationFn: srv.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
        },
    })

    const markAllReadMutation = useMutation({
        mutationFn: srv.markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: srv.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
        },
    })

    const unreadCount = unreadData?.count || 0

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'comment':
                return <MessageCircle size={14} className="text-blue-500" />
            case 'share':
                return <Share2 size={14} className="text-green-500" />
            case 'collaborator':
                return <UserPlus size={14} className="text-purple-500" />
            default:
                return <Bell size={14} className="text-zinc-400" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'comment':
                return '评论了你'
            case 'share':
                return '分享了文档给你'
            case 'collaborator':
                return '邀请你协作'
            default:
                return '提及了你'
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return '刚刚'
        if (diffMins < 60) return `${diffMins}分钟前`
        if (diffHours < 24) return `${diffHours}小时前`
        if (diffDays < 7) return `${diffDays}天前`
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }

    const handleClick = (notification: Notification) => {
        if (!notification.read) {
            markReadMutation.mutate(notification.notificationId)
        }
        navigate(`/doc/${notification.pageId}`)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                    <span className="font-medium text-sm">通知</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-zinc-500 hover:text-foreground"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <Check size={12} className="mr-1" />
                            全部已读
                        </Button>
                    )}
                </div>
                <div className="h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <Bell size={24} className="mb-2 text-zinc-300" />
                            <p className="text-sm">暂无通知</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(notification => (
                                <div
                                    key={notification.notificationId}
                                    className={`p-3 hover:bg-zinc-50 cursor-pointer transition-colors ${
                                        !notification.read ? 'bg-blue-50/50' : ''
                                    }`}
                                    onClick={() => handleClick(notification)}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5 shrink-0">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="font-medium">
                                                    {notification.fromUser?.username || '用户'}
                                                </span>
                                                <span className="text-zinc-500 ml-1">
                                                    {getTypeLabel(notification.type)}
                                                </span>
                                            </p>
                                            {notification.content && (
                                                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                                                    {notification.content}
                                                </p>
                                            )}
                                            <span className="text-[10px] text-zinc-400 mt-1 block">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    deleteMutation.mutate(notification.notificationId)
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
