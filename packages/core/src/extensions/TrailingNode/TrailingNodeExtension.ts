/**
 * 尾部节点扩展
 *
 * 该扩展确保文档末尾始终有一个空的段落节点。
 * 当用户删除到文档末尾时，会自动插入一个新的空白块容器，
 * 保持编辑器始终有一个可输入的位置。
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

/**
 * 尾部节点配置选项
 */
export interface TrailingNodeOptions {
    node: string
}

/**
 * 尾部节点扩展
 *
 * 该扩展通过ProseMirror插件实现，负责：
 * - 监控文档状态，判断是否需要在末尾插入新节点
 * - 当最后一个块容器内容为空或不可编辑时，自动插入新的段落
 * - 保持文档结构完整性，确保用户始终可以在末尾输入内容
 */
export const TrailingNode = Extension.create<TrailingNodeOptions>({
    name: 'trailingNode',

    /**
     * 添加ProseMirror插件
     *
     * 插件状态管理：
     * - init: 初始化状态
     * - apply: 每次事务应用时判断是否需要插入新节点
     *
     * 判断逻辑：
     * 检查最后一个blockContainer节点的最后一个内容节点是否为空
     * 如果为空（节点大小<=4）或者内容类型不是inline*，则需要插入新节点
     */
    addProseMirrorPlugins() {
        const plugin = new PluginKey(this.name)

        return [
            new Plugin({
                key: plugin,
                appendTransaction: (_, __, state) => {
                    const { doc, tr, schema } = state
                    const shouldInsertNodeAtEnd = plugin.getState(state)
                    const endPosition = doc.content.size - 2
                    const type = schema.nodes['blockContainer']
                    const contentType = schema.nodes['paragraph']
                    if (!shouldInsertNodeAtEnd) {
                        return
                    }

                    return tr.insert(endPosition, type.create(undefined, contentType.create()))
                },
                state: {
                    init: (/* _, _state */) => {},
                    apply: (tr, value) => {
                        if (!tr.docChanged) {
                            return value
                        }

                        let lastNode = tr.doc.lastChild

                        if (!lastNode || lastNode.type.name !== 'blockGroup') {
                            throw new Error('Expected blockGroup')
                        }

                        lastNode = lastNode.lastChild

                        if (!lastNode || lastNode.type.name !== 'blockContainer') {
                            throw new Error('Expected blockContainer')
                        }

                        const lastContentNode = lastNode.firstChild

                        if (!lastContentNode) {
                            throw new Error('Expected blockContent')
                        }

                        /**
                         * 判断是否需要插入新节点的条件：
                         * - lastNode.nodeSize > 4 表示最后一个块容器有实际内容
                         * - 或者内容节点的内容类型不是 'inline*'（不允许内联内容）
                         * 满足任一条件则需要插入新的尾部节点
                         */
                        return lastNode.nodeSize > 4 || lastContentNode.type.spec.content !== 'inline*'
                    },
                },
            }),
        ]
    },
})
