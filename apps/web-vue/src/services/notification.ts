import { request } from '@/utils/request'

export const fetchNotifications = async () => {
    return await request.get('/notification')
}

export const fetchUnreadCount = async () => {
    return await request.get('/notification/unread-count')
}

export const markNotificationRead = async (notificationId: string) => {
    return await request.post(`/notification/${notificationId}/read`)
}

export const markAllNotificationsRead = async () => {
    return await request.post('/notification/read-all')
}

export const deleteNotification = async (notificationId: string) => {
    return await request.delete(`/notification/${notificationId}`)
}
