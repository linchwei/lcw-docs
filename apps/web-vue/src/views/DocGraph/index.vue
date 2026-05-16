<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { VueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import * as d3 from 'd3-force'
import { NButton, NSpin } from 'naive-ui'
import { FileText, GitBranch } from 'lucide-vue-next'

import * as srv from '@/services'

const router = useRouter()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const simulationReady = ref(false)

const { data: pages = [], isLoading } = useQuery({
    queryKey: ['pageGraph'],
    queryFn: async () => {
        return (await srv.fetchPageGraph()).data
    },
})

let simulation: d3.Simulation<any, any> | null = null
let pagesKey = ''

function buildGraph() {
    const newKey = pages.value.map((p: any) => `${p.pageId}:${(p.links || []).join(',')}`).join('|')
    if (pagesKey === newKey) return
    pagesKey = newKey

    if (pages.value.length === 0) {
        nodes.value = []
        edges.value = []
        simulationReady.value = true
        return
    }

    simulationReady.value = false

    const initialNodes = pages.value.map((page: any, i: number) => ({
        id: page.pageId,
        type: 'default',
        data: {
            label: `${page.emoji || '📄'} ${page.title}`,
        },
        position: { x: 0, y: 0 },
        draggable: true,
    }))

    const initialEdges: any[] = []
    for (const page of pages.value) {
        for (const link of page.links || []) {
            if (pages.value.find((p: any) => p.pageId === link)) {
                initialEdges.push({
                    id: `${page.pageId}-${link}`,
                    source: page.pageId,
                    target: link,
                    type: 'default',
                    animated: false,
                })
            }
        }
    }

    // d3-force layout
    simulation = d3
        .forceSimulation(initialNodes.map((n: any) => ({ ...n })))
        .force('charge', d3.forceManyBody().strength(-120))
        .force('collide', d3.forceCollide(100))
        .force('link', d3.forceLink(initialEdges).strength(0.5).distance(200).iterations(100))

    simulation.on('end', () => {
        simulationReady.value = true
    })

    simulation.on('tick', () => {
        if (!simulation) return
        const simNodes = simulation.nodes()
        const updatedNodes = (nodes.value as any[]).length === 0
            ? initialNodes.map((n: any, i: number) => ({
                ...n,
                position: { x: simNodes[i]?.x || 0, y: simNodes[i]?.y || 0 },
            }))
            : nodes.value.map((n: any, i: number) => ({
                ...n,
                position: { x: simNodes[i]?.x || 0, y: simNodes[i]?.y || 0 },
            }))
        nodes.value = updatedNodes as any
    })

    // Set edges
    edges.value = initialEdges as Edge[]
    nodes.value = initialNodes as Node[]
}

// Watch for page changes
let pagesWatchStop: (() => void) | undefined

onMounted(() => {
    pagesWatchStop = watch(pages, () => buildGraph(), { deep: true, immediate: true })
})

onBeforeUnmount(() => {
    simulation?.stop()
    simulation = null
    pagesWatchStop?.()
})

const edgeCount = ref(0)

watch(pages, (val) => {
    edgeCount.value = val.reduce((count: number, page: any) => count + (page.links || []).length, 0)
}, { immediate: true })

function handleNodeClick({ node }: { node: Node }) {
    nodes.value = nodes.value.map((n) => ({ ...n, selected: n.id === node.id })) as any
    edges.value = edges.value.map((e) => ({ ...e, selected: e.source === node.id || e.target === node.id })) as any
}

function handleNodeDoubleClick({ node }: { node: Node }) {
    router.push(`/doc/${node.id}`)
}

function handlePaneClick() {
    nodes.value = nodes.value.map((n) => ({ ...n, selected: false })) as any
    edges.value = edges.value.map((e) => ({ ...e, selected: false })) as any
}

const isEmpty = computed(() => pages.value.length === 0)
const hasNoLinks = computed(() => !isEmpty.value && edgeCount.value === 0)
</script>

<template>
    <div class="docgraph-page">
        <!-- Header -->
        <div class="docgraph-header">
            <h1 class="docgraph-title">文档图谱</h1>
            <div v-if="!isEmpty" class="docgraph-stats">
                <span class="stat-item">
                    <FileText :size="16" />
                    {{ pages.length }} 篇文档
                </span>
                <span class="stat-item">
                    <GitBranch :size="16" />
                    {{ edgeCount }} 条关联
                </span>
            </div>
        </div>

        <!-- Graph area -->
        <div class="docgraph-canvas">
            <!-- Loading overlay -->
            <div v-if="isLoading || !simulationReady" class="docgraph-loading">
                <NSpin />
                <p>{{ isLoading ? '加载中...' : '布局计算中...' }}</p>
            </div>

            <!-- Empty state -->
            <div v-if="isEmpty && simulationReady" class="docgraph-empty">
                <FileText :size="48" />
                <p class="empty-title">暂无文档</p>
                <p class="empty-desc">创建文档并使用 @提及 来建立关联</p>
            </div>

            <!-- Graph -->
            <template v-if="!isEmpty && simulationReady">
                <VueFlow
                    :nodes="nodes"
                    :edges="edges"
                    :node-click-distance="5"
                    fit-view-on-init
                    @node-click="handleNodeClick"
                    @node-double-click="handleNodeDoubleClick"
                    @pane-click="handlePaneClick"
                >
                    <Background />
                    <Controls />
                    <MiniMap node-stroke-width="3" pannable zoomable />
                </VueFlow>

                <div v-if="hasNoLinks" class="no-links-hint">
                    暂无文档关联，在文档中使用 @提及 其他文档来建立关联
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.docgraph-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: hsl(var(--background));
}

.docgraph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px 0;
    flex-shrink: 0;
}

.docgraph-title {
    font-size: 26px;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin: 0;
    letter-spacing: -0.02em;
}

.docgraph-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
}

.stat-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.docgraph-canvas {
    flex: 1;
    position: relative;
    margin: 16px 32px 24px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card));
    min-height: 300px;
}

.docgraph-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    z-index: 10;
    color: hsl(var(--muted-foreground));
    font-size: 14px;
    background: hsl(var(--card));
}

.docgraph-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: hsl(var(--muted-foreground));
    gap: 8px;
}

.empty-title {
    font-size: 16px;
    font-weight: 600;
    margin: 12px 0 0;
    color: hsl(var(--foreground));
}

.empty-desc {
    font-size: 13px;
    margin: 0;
}

.no-links-hint {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    background: hsl(var(--card) / 0.9);
    backdrop-filter: blur(6px);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    box-shadow: 0 1px 4px hsl(var(--foreground) / 0.08);
    white-space: nowrap;
    border: 1px solid hsl(var(--border));
}
</style>
