export interface Page {
    id: number
    pageId: string
    emoji: string
    title: string
    folderId: string | null
    coverImage: string | null
    isFavorite: boolean
    isDeleted: boolean
    role?: 'owner' | 'editor' | 'commenter' | 'viewer'
    createdAt: string
    updatedAt: string
}
