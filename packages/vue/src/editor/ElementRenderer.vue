<script lang="ts">
import { defineComponent, shallowRef, h, Teleport, type VNode, onMounted, onUnmounted } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

interface RenderData {
    node: VNode
    container: HTMLElement
}

/**
 * ElementRenderer
 *
 * 渲染函数式组件，将 VNode 通过 Teleport 渲染到指定 DOM 容器中。
 * 在挂载时将 renderNode 方法注册到 editor.elementRenderer 上。
 *
 * Vue 中 render() 本身就是同步的，不需要 flushSync 模式。
 * Teleport 保证了渲染的内容保留在当前组件树的 provide/inject 上下文中。
 */
export default defineComponent({
    props: {
        editor: {
            type: Object as () => LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>,
            required: true,
        },
    },
    setup(props, { expose }) {
        const renderData = shallowRef<RenderData | null>(null)

        function renderNode(node: VNode, container: HTMLElement): void {
            renderData.value = { node, container }
        }

        expose({ renderNode })

        onMounted(() => {
            ;(props.editor as any).elementRenderer = renderNode
        })

        onUnmounted(() => {
            ;(props.editor as any).elementRenderer = null
        })

        return { renderData }
    },
    render() {
        if (this.renderData) {
            return h(Teleport, { to: this.renderData.container }, this.renderData.node)
        }
        return null
    },
})
</script>
