import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { renderWithProviders, mockAuthenticatedUser, clearAuthenticatedUser } from '@/test/helpers'
import { server } from '@/test/mocks/server'

vi.mock('@/services', async () => {
    const actual = await vi.importActual('@/services')
    return actual
})

vi.mock('@xyflow/react', () => ({
    ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
    MiniMap: () => <div data-testid="mini-map" />,
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
    applyNodeChanges: (_: any, nodes: any) => nodes,
    applyEdgeChanges: (_: any, edges: any) => edges,
    MarkerType: { ArrowClosed: 'arrowClosed' },
}))

vi.mock('d3-force', () => {
    const createMockSimulation = () => {
        const sim: any = {
            force: vi.fn().mockReturnThis(),
            on: vi.fn().mockImplementation((event: string, callback: () => void) => {
                if (event === 'end') {
                    Promise.resolve().then(() => callback())
                }
                return sim
            }),
            stop: vi.fn(),
            nodes: vi.fn().mockReturnValue([]),
        }
        return sim
    }
    return {
        forceSimulation: vi.fn().mockImplementation(createMockSimulation),
        forceManyBody: vi.fn().mockReturnValue({ strength: vi.fn().mockReturnValue({}) }),
        forceCollide: vi.fn().mockReturnValue({}),
        forceLink: vi.fn().mockReturnValue({ strength: vi.fn().mockReturnValue({ distance: vi.fn().mockReturnValue({ iterations: vi.fn().mockReturnValue({}) }) }) }),
        forceCenter: vi.fn().mockReturnValue({}),
        forceRadial: vi.fn().mockReturnValue({ strength: vi.fn().mockReturnValue({}) }),
    }
})

import { DocGraph } from './index'

describe('DocGraph Page', () => {
    beforeEach(() => {
        mockAuthenticatedUser()
    })

    afterEach(() => {
        clearAuthenticatedUser()
    })

    it('UI-046: should render graph page with data', async () => {
        server.use(
            http.get('/api/page/graph', () => {
                return HttpResponse.json({
                    data: [
                        { pageId: 'page1', title: 'Page 1', emoji: '📄', links: ['page2'] },
                        { pageId: 'page2', title: 'Page 2', emoji: '📝', links: [] },
                    ],
                    success: true,
                })
            })
        )

        renderWithProviders(<DocGraph />)

        await waitFor(() => {
            expect(screen.getByText('文档图谱')).toBeInTheDocument()
        })
    })

    it('UI-048: should render graph page with empty data', async () => {
        server.use(
            http.get('/api/page/graph', () => {
                return HttpResponse.json({ data: [], success: true })
            })
        )

        renderWithProviders(<DocGraph />)

        await waitFor(() => {
            expect(screen.getByText('文档图谱')).toBeInTheDocument()
        })
    })
})
