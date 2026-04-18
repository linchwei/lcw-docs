import '@xyflow/react/dist/style.css'

import { SidebarInset, SidebarTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { useQuery } from '@tanstack/react-query'
import { applyEdgeChanges, applyNodeChanges, Background, Controls, Edge, EdgeChange, MiniMap, Node, NodeChange, ReactFlow } from '@xyflow/react'
import * as d3 from 'd3-force'
import { FileText, GitBranch, Loader } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'

import { GraphEdge } from './Edge'
import { GraphNode } from './Node'

const nodesTypes = {
    graph: GraphNode,
}

const edgeTypes = {
    graph: GraphEdge,
}

export function DocGraph() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])
    const [simulationReady, setSimulationReady] = useState(false)
    const navigate = useNavigate()
    const pagesRef = useRef<string>('')

    const { data: pages = [], isLoading } = useQuery({
        queryKey: ['pageGraph'],
        queryFn: async () => {
            return (await srv.fetchPageGraph()).data
        },
    })

    const pagesKey = useMemo(() => {
        return pages.map(p => `${p.pageId}:${(p.links || []).join(',')}`).join('|')
    }, [pages])

    const edgeCount = useMemo(() => {
        let count = 0
        for (const page of pages) {
            count += (page.links || []).length
        }
        return count
    }, [pages])

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const { id } = node
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === id })))
        setEdges(eds => eds.map(e => ({ ...e, selected: e.source === id || e.target === id })))
    }, [])

    const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
        navigate(`/doc/${node.id}`)
    }, [navigate])

    const handlePaneClick = useCallback(() => {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })))
        setEdges(eds => eds.map(e => ({ ...e, selected: false })))
    }, [])

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), [setNodes])
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), [setEdges])

    useEffect(() => {
        if (pagesRef.current === pagesKey) return
        pagesRef.current = pagesKey

        if (pages.length === 0) {
            setNodes([])
            setEdges([])
            setSimulationReady(true)
            return
        }

        setSimulationReady(false)

        const initialNodes = pages.map(page => {
            return {
                id: page.pageId,
                type: 'graph',
                data: {
                    emoji: page.emoji,
                    title: page.title,
                },
                width: 120,
                height: 80,
                x: 0,
                y: 0,
            }
        })

        const initialEdges = []
        for (let pi = 0; pi < pages.length; pi++) {
            const page = pages[pi]
            for (const link of page.links || []) {
                const targetIndex = pages.findIndex(p => p.pageId === link)
                if (targetIndex === -1) {
                    continue
                }
                initialEdges.push({
                    id: `${page.pageId}-${link}`,
                    data: {
                        label: '@提及',
                    },
                    source: pi,
                    target: targetIndex,
                })
            }
        }

        const simulation = d3
            .forceSimulation(initialNodes)
            .force('charge', d3.forceManyBody().strength(-120))
            .force('collide', d3.forceCollide(100))
            .force('link', d3.forceLink(initialEdges).strength(0.5).distance(200).iterations(100))
            .force('center', d3.forceCenter(500, 350))
            .force('radial', d3.forceRadial(150, 500, 350).strength(0.3))

        simulation.on('end', () => {
            setSimulationReady(true)
        })

        simulation.on('tick', () => {
            const forceNodes = simulation.nodes().map(node => ({ ...node, position: { x: node.x, y: node.y } }))
            setNodes(forceNodes)
        })

        // @ts-expect-error force edge type
        const flowEdges = initialEdges.map(edge => ({ ...edge, type: 'graph', source: edge?.source.id, target: edge?.target.id }))
        setEdges(flowEdges)

        return () => {
            simulation.stop()
        }
    }, [pages, pagesKey])

    const isEmpty = pages.length === 0
    const hasNoLinks = !isEmpty && edgeCount === 0

    return (
        <SidebarInset>
            <div className="flex flex-col w-full h-full">
                <div className="flex flex-row items-center justify-between p-6 gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <SidebarTrigger />
                        <h1 className="text-xl text-zinc-500">文档图谱</h1>
                    </div>
                    {!isEmpty && (
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {pages.length} 篇文档
                            </span>
                            <span className="flex items-center gap-1">
                                <GitBranch className="w-4 h-4" />
                                {edgeCount} 条关联
                            </span>
                        </div>
                    )}
                </div>
                <div className="w-full h-full relative">
                    {(isLoading || !simulationReady) && (
                        <div className="w-full h-full flex justify-center items-center bg-zinc-50/30 absolute z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Loader className="w-8 h-8 animate-spin text-zinc-400" />
                                <p className="text-sm text-zinc-400">
                                    {isLoading ? '加载中...' : '布局计算中...'}
                                </p>
                            </div>
                        </div>
                    )}
                    {isEmpty && simulationReady && (
                        <div className="w-full h-full flex justify-center items-center">
                            <div className="flex flex-col items-center gap-3 text-zinc-400">
                                <FileText className="w-12 h-12" />
                                <p className="text-lg font-medium">暂无文档</p>
                                <p className="text-sm">创建文档并使用 @提及 来建立关联</p>
                            </div>
                        </div>
                    )}
                    {hasNoLinks && simulationReady && (
                        <div className="w-full h-full">
                            <ReactFlow
                                nodesDraggable
                                proOptions={{ hideAttribution: true }}
                                nodes={nodes}
                                edges={edges}
                                nodeTypes={nodesTypes}
                                edgeTypes={edgeTypes}
                                onNodeClick={handleNodeClick}
                                onNodeDoubleClick={handleNodeDoubleClick}
                                onPaneClick={handlePaneClick}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                fitView
                            >
                                <Background />
                                <Controls />
                                <MiniMap
                                    nodeStrokeWidth={3}
                                    pannable
                                    zoomable
                                />
                            </ReactFlow>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-zinc-500 shadow-sm">
                                暂无文档关联，在文档中使用 @提及 其他文档来建立关联
                            </div>
                        </div>
                    )}
                    {!isEmpty && !hasNoLinks && (
                        <ReactFlow
                            nodesDraggable
                            proOptions={{ hideAttribution: true }}
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodesTypes}
                            edgeTypes={edgeTypes}
                            onNodeClick={handleNodeClick}
                            onNodeDoubleClick={handleNodeDoubleClick}
                            onPaneClick={handlePaneClick}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            fitView
                        >
                            <Background />
                            <Controls />
                            <MiniMap
                                nodeStrokeWidth={3}
                                pannable
                                zoomable
                            />
                        </ReactFlow>
                    )}
                </div>
            </div>
        </SidebarInset>
    )
}
