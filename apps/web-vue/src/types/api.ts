import { Page } from './page'

/**
 * 用户相关
 */
export interface CreateUserPayload {
    username: string
    password: string
}

export interface LoginPayload {
    username: string
    password: string
}

export interface LoginRes {
    data: {
        access_token: string
    }
}

export interface User {
    username: string
    email: string
}
export interface CurrentUserRes {
    data: User
}

/**
 * 页面相关
 */
/**
 * 创建页面
 */
export interface CreatePagePayload {
    emoji: string
    title: string
}

/**
 * 更新页面
 */
export interface UpdatePagePayload {
    pageId: string
    title?: string
    coverImage?: string | null
    folderId?: string | null
}

/**
 * 页面列表
 */
export interface PageListRes {
    data: {
        pages: Page[]
        count: number
    }
}

/**
 * 页面关系图谱
 */
export interface WithLinksPage extends Page {
    links: string[]
}
export interface PageGraphRes {
    data: WithLinksPage[]
}

export interface ShareLink {
    id: number
    shareId: string
    pageId: string
    permission: string
    expiresAt: string | null
    createdBy: number
    createdAt: string
}

export interface CreateSharePayload {
    pageId: string
    permission: 'view' | 'comment' | 'edit'
    password?: string
    expiresAt?: string
}

export interface ShareInfoRes {
    data: ShareLink
    success: boolean
}
export interface ShareListRes {
    data: ShareLink[]
    success: boolean
}

export interface Comment {
    id: number
    commentId: string
    pageId: string
    content: string
    anchorText?: string
    anchorPos?: string
    parentId?: string
    resolvedAt?: string
    createdBy: number
    createdAt: string
    replies?: Comment[]
}

export interface CreateCommentPayload {
    pageId: string
    content: string
    anchorText?: string
    anchorPos?: string
}

export interface ReplyCommentPayload {
    parentId: string
    content: string
}

export interface SearchResult {
    pageId: string
    emoji: string
    title: string
    snippet: string
    updatedAt: string
    matchType: 'title' | 'content'
}

export interface SearchRes {
    data: SearchResult[]
    success: boolean
}

export interface Version {
    id: number
    versionId: string
    pageId: string
    snapshot: string
    description: string | null
    source: string
    createdBy: number
    createdAt: string
}

export interface VersionDiff {
    added: Array<{ blockType: string; content: string }>
    removed: Array<{ blockType: string; content: string }>
    modified: Array<{ blockType: string; oldContent: string; newContent: string }>
}

export interface VersionListRes {
    data: Version[]
    success: boolean
}

export interface VersionRes {
    data: Version
    success: boolean
}

export interface Folder {
    id: number
    folderId: string
    name: string
    parentId: string | null
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface FolderListRes {
    data: Folder[]
    success: boolean
}

export interface Collaborator {
    collaboratorId?: string
    userId: number
    username: string
    role: 'owner' | 'editor' | 'commenter' | 'viewer'
    pageId: string
    createdAt?: string
}

export interface CollaboratorListRes {
    data: Collaborator[]
    success: boolean
}

export interface Notification {
    id: number
    notificationId: string
    type: 'mention' | 'comment' | 'share' | 'collaborator'
    fromUserId: number
    toUserId: number
    pageId: string
    content: string | null
    read: boolean
    fromUser?: { id: number; username: string }
    createdAt: string
}

export interface NotificationListRes {
    data: Notification[]
    success: boolean
}

export interface UnreadCountRes {
    data: { count: number }
    success: boolean
}

export interface Tag {
    id: number
    tagId: string
    name: string
    color: string
    userId: number
    createdAt: string
}

export interface TagListRes {
    data: Tag[]
    success: boolean
}

export interface PageTag {
    pageId: string
    tagId: string
}

export interface BacklinkItem {
    pageId: string
    emoji: string
    title: string
    updatedAt: string
}

export interface BacklinksRes {
    data: BacklinkItem[]
    success: boolean
}

export interface SharedPage {
    pageId: string
    emoji: string
    title: string
    role: 'owner' | 'editor' | 'commenter' | 'viewer'
    ownerName: string
    updatedAt: string
    createdAt: string
}

export interface SharedPagesRes {
    data: SharedPage[]
    success: boolean
}
