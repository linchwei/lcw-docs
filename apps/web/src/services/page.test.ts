import { describe, it, expect, beforeEach } from 'vitest'

import { mockAuthenticatedUser, clearAuthenticatedUser } from '../test/helpers'

import {
    fetchPageList,
    createPage,
    updatePage,
    removePage,
    searchPages,
    toggleFavorite,
    fetchTrashList,
    restorePage,
    permanentDeletePage,
    fetchRecentPages,
    fetchSharedPages,
    fetchPageGraph,
    fetchBacklinks,
    fetchPageDetail,
} from './page'

describe('page service', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('SRV-005: should fetch page list', async () => {
        const res = await fetchPageList()
        expect(res).toHaveProperty('data')
        expect(res.data).toHaveProperty('pages')
        expect(res.data).toHaveProperty('count')
    })

    it('SRV-006: should create a page', async () => {
        const res = await createPage({ emoji: '📄', title: 'New Page' })
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })

    it('SRV-007: should update a page', async () => {
        const res = await updatePage({ pageId: 'page1', title: 'Updated' })
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })

    it('SRV-008: should delete a page', async () => {
        const res = await removePage('page1')
        expect(res).toHaveProperty('success', true)
    })

    it('SRV-009: should search pages', async () => {
        const res = await searchPages('Test')
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })

    it('SRV-010: should toggle favorite', async () => {
        const res = await toggleFavorite('page1')
        expect(res).toHaveProperty('data')
        expect(res.success).toBe(true)
    })

    it('SRV-011: should fetch trash list', async () => {
        const res = await fetchTrashList()
        expect(res).toHaveProperty('data')
    })

    it('SRV-012: should restore a page', async () => {
        const res = await restorePage('page1')
        expect(res).toHaveProperty('success', true)
    })

    it('SRV-013: should permanently delete a page', async () => {
        const res = await permanentDeletePage('page1')
        expect(res).toHaveProperty('success', true)
    })

    it('should fetch recent pages', async () => {
        const res = await fetchRecentPages()
        expect(res).toHaveProperty('data')
    })

    it('should fetch shared pages', async () => {
        const res = await fetchSharedPages()
        expect(res).toHaveProperty('data')
    })

    it('should fetch page graph', async () => {
        const res = await fetchPageGraph()
        expect(res).toHaveProperty('data')
    })

    it('should fetch backlinks', async () => {
        const res = await fetchBacklinks('page1')
        expect(res).toHaveProperty('data')
    })

    it('should fetch page detail', async () => {
        const res = await fetchPageDetail('page1')
        expect(res).toHaveProperty('data')
    })
})
