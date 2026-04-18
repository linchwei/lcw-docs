/**
 * 上一个块类型插件
 *
 * 该插件跟踪文档中块的类型变化，并在块上添加装饰器属性以存储之前的状态信息。
 * 这对于实现撤销/重做功能以及块的动态样式更新非常有用。
 */

import { findChildren } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const PLUGIN_KEY = new PluginKey(`previous-blocks`)

/**
 * 节点属性名称映射
 *
 * 将内部属性名称映射到装饰器属性名称前缀
 */
const nodeAttributes: Record<string, string> = {
    index: 'index',
    level: 'level',
    type: 'type',
    depth: 'depth',
    'depth-change': 'depth-change',
}

/**
 * 上一个块类型插件
 *
 * 该插件的主要功能：
 * 1. 跟踪文档中每个有ID的块的类型变化
 * 2. 记录块变化前的状态（类型、层级、索引等）
 * 3. 通过装饰器将之前的状态以data-*属性形式添加到DOM节点上
 * 4. 支持numberedListIndexing元数据的特殊处理
 */
export const PreviousBlockTypePlugin = () => {
    let timeout: any
    return new Plugin({
        key: PLUGIN_KEY,
        view() {
            return {
                update: async view => {
                    if (this.key?.getState(view.state).updatedBlocks.size > 0) {
                        timeout = setTimeout(() => {
                            view.dispatch(view.state.tr.setMeta(PLUGIN_KEY, { clearUpdate: true }))
                        }, 0)
                    }
                },
                destroy: () => {
                    if (timeout) {
                        clearTimeout(timeout)
                    }
                },
            }
        },
        state: {
            /**
             * 初始化插件状态
             */
            init() {
                return {
                    prevTransactionOldBlockAttrs: {} as any,
                    currentTransactionOldBlockAttrs: {} as any,
                    updatedBlocks: new Set<string>(),
                }
            },

            /**
             * 应用事务时更新插件状态
             *
             * 核心逻辑：
             * 1. 比较事务前后的文档，找出发生变化的块
             * 2. 记录每个变化块之前的属性状态
             * 3. 将变化块添加到updatedBlocks集合
             */
            apply(transaction, prev, oldState, newState) {
                prev.currentTransactionOldBlockAttrs = {}
                prev.updatedBlocks.clear()

                if (!transaction.docChanged || oldState.doc.eq(newState.doc)) {
                    return prev
                }

                const currentTransactionOriginalOldBlockAttrs = {} as any
                const oldNodes = findChildren(oldState.doc, node => node.attrs.id)
                const oldNodesById = new Map(oldNodes.map(node => [node.node.attrs.id, node]))
                const newNodes = findChildren(newState.doc, node => node.attrs.id)

                for (const node of newNodes) {
                    const oldNode = oldNodesById.get(node.node.attrs.id)

                    const oldContentNode = oldNode?.node.firstChild
                    const newContentNode = node.node.firstChild

                    if (oldNode && oldContentNode && newContentNode) {
                        const newAttrs = {
                            index: newContentNode.attrs.index,
                            level: newContentNode.attrs.level,
                            type: newContentNode.type.name,
                            depth: newState.doc.resolve(node.pos).depth,
                        }

                        let oldAttrs = {
                            index: oldContentNode.attrs.index,
                            level: oldContentNode.attrs.level,
                            type: oldContentNode.type.name,
                            depth: oldState.doc.resolve(oldNode.pos).depth,
                        }

                        currentTransactionOriginalOldBlockAttrs[node.node.attrs.id] = oldAttrs

                        /**
                         * 处理有序列表索引的特殊情况
                         * 如果事务带有numberedListIndexing元数据，需要从之前的事务中获取旧索引
                         */
                        if (transaction.getMeta('numberedListIndexing')) {
                            if (node.node.attrs.id in prev.prevTransactionOldBlockAttrs) {
                                oldAttrs = prev.prevTransactionOldBlockAttrs[node.node.attrs.id]
                            }

                            if (newAttrs.type === 'numberedListItem') {
                                oldAttrs.index = newAttrs.index
                            }
                        }

                        prev.currentTransactionOldBlockAttrs[node.node.attrs.id] = oldAttrs

                        if (JSON.stringify(oldAttrs) !== JSON.stringify(newAttrs)) {
                            ;(oldAttrs as any)['depth-change'] = oldAttrs.depth - newAttrs.depth

                            prev.updatedBlocks.add(node.node.attrs.id)
                        }
                    }
                }

                prev.prevTransactionOldBlockAttrs = currentTransactionOriginalOldBlockAttrs

                return prev
            },
        },
        props: {
            /**
             * 提供装饰器
             *
             * 为发生变化的块添加包含之前状态信息的装饰器属性
             * 这些属性以data-prev-*的形式添加到DOM元素上
             */
            decorations(state) {
                const pluginState = (this as Plugin).getState(state)
                if (pluginState.updatedBlocks.size === 0) {
                    return undefined
                }

                const decorations: Decoration[] = []

                state.doc.descendants((node, pos) => {
                    if (!node.attrs.id) {
                        return
                    }

                    if (!pluginState.updatedBlocks.has(node.attrs.id)) {
                        return
                    }

                    const prevAttrs = pluginState.currentTransactionOldBlockAttrs[node.attrs.id]
                    const decorationAttrs: any = {}

                    for (const [nodeAttr, val] of Object.entries(prevAttrs)) {
                        decorationAttrs['data-prev-' + nodeAttributes[nodeAttr]] = val || 'none'
                    }

                    const decoration = Decoration.node(pos, pos + node.nodeSize, {
                        ...decorationAttrs,
                    })

                    decorations.push(decoration)
                })

                return DecorationSet.create(state.doc, decorations)
            },
        },
    })
}
