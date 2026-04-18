import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { mockAuthenticatedUser, clearAuthenticatedUser } from '../test/helpers'

import { fetchTags, createTag, addPageTag, fetchPageTags } from './tag'
import { fetchFolders, createFolder } from './folder'
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead } from './notification'
import { fetchVersions } from './version'
import { createShare, fetchSharesByPageId } from './share'
import { fetchCollaborators } from './collaborator'
import { fetchComments } from './comment'

describe('tag service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('SRV-025/026: should fetch and create tags', async () => {
        const list = await fetchTags()
        expect(list).toHaveProperty('data')

        const tag = await createTag({ name: 'New Tag', color: '#0000ff' })
        expect(tag).toHaveProperty('data')
        expect(tag.success).toBe(true)
    })

    it('SRV-027: should add page tag', async () => {
        const res = await addPageTag({ pageId: 'page1', tagId: 'tag1' })
        expect(res).toHaveProperty('success', true)
    })

    it('SRV-008 variant: should fetch page tags', async () => {
        const res = await fetchPageTags('page1')
        expect(res).toHaveProperty('data')
    })
})

describe('folder service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('should fetch folders', async () => {
        const res = await fetchFolders()
        expect(res).toHaveProperty('data')
    })

    it('should create a folder', async () => {
        const res = await createFolder({ name: 'New Folder' })
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })
})

describe('notification service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('SRV-028: should fetch notifications', async () => {
        const res = await fetchNotifications()
        expect(res).toHaveProperty('data')
    })

    it('should fetch unread count', async () => {
        const res = await fetchUnreadCount()
        expect(res).toHaveProperty('data')
        expect(res.data).toHaveProperty('count')
    })

    it('SRV-029: should mark all notifications read', async () => {
        const res = await markAllNotificationsRead()
        expect(res).toHaveProperty('success', true)
    })
})

describe('version service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('SRV-015: should fetch versions', async () => {
        const res = await fetchVersions('page1')
        expect(res).toHaveProperty('data')
    })
})

describe('share service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('SRV-018: should create share', async () => {
        const res = await createShare({ pageId: 'page1', permission: 'view' })
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })

    it('SRV-005 variant: should fetch shares by page id', async () => {
        const res = await fetchSharesByPageId('page1')
        expect(res).toHaveProperty('data')
    })
})

describe('collaborator service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('should fetch collaborators', async () => {
        const res = await fetchCollaborators('page1')
        expect(res).toHaveProperty('data')
    })
})

describe('comment service', () => {
    beforeEach(() => mockAuthenticatedUser())
    afterEach(() => clearAuthenticatedUser())

    it('should fetch comments', async () => {
        const res = await fetchComments('page1')
        expect(res).toHaveProperty('data')
    })
})
