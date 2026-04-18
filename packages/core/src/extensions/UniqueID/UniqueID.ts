/**
 * 唯一ID扩展
 *
 * 该扩展为编辑器中的指定节点类型自动生成唯一ID标识符。
 * 主要功能包括：
 * - 在节点创建时自动分配唯一ID
 * - 处理拖拽粘贴时重置ID以避免重复
 * - 支持自定义ID生成器和属性名称
 * - 提供过滤事务的选项以控制何时生成ID
 */

import { combineTransactionSteps, Extension, findChildrenInRange, getChangedRanges } from '@tiptap/core'
import { Fragment, Slice } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { v4 } from 'uuid'

/**
 * 去除数组中重复项
 * @param array - 待处理的数组
 * @param by - 用于生成唯一键的函数，默认为JSON.stringify
 * @returns 去重后的数组
 */
function removeDuplicates(array: any, by = JSON.stringify) {
    const seen: any = {}
    return array.filter((item: any) => {
        const key = by(item)
        return Object.prototype.hasOwnProperty.call(seen, key) ? false : (seen[key] = true)
    })
}

/**
 * 查找数组中的重复项
 * @param items - 待检查的数组
 * @returns 包含所有重复项的数组
 */
function findDuplicates(items: any) {
    const filtered = items.filter((el: any, index: number) => items.indexOf(el) !== index)
    const duplicates = removeDuplicates(filtered)
    return duplicates
}

/**
 * 唯一ID扩展
 *
 * 该扩展为节点自动生成唯一标识符，支持：
 * - 配置要添加ID的节点类型列表
 * - 自定义ID生成函数
 * - 控制何时应该或不应该生成ID的事务过滤
 * - 拖拽和粘贴处理以避免ID重复
 */
const UniqueID = Extension.create({
    name: 'uniqueID',
    priority: 10000,
    addOptions() {
        return {
            attributeName: 'id',
            types: [] as string[],
            setIdAttribute: false,
            generateID: () => {
                if (typeof window !== 'undefined' && (window as any).__TEST_OPTIONS) {
                    const testOptions = (window as any).__TEST_OPTIONS
                    if (testOptions.mockID === undefined) {
                        testOptions.mockID = 0
                    } else {
                        testOptions.mockID++
                    }

                    return testOptions.mockID.toString() as string
                }

                return v4()
            },
            filterTransaction: null,
        }
    },

    /**
     * 添加全局属性配置
     * 为指定节点类型添加ID属性，支持HTML的data-*属性解析和渲染
     */
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    [this.options.attributeName]: {
                        default: null,
                        parseHTML: element => element.getAttribute(`data-${this.options.attributeName}`),
                        renderHTML: attributes => {
                            const defaultIdAttributes = {
                                [`data-${this.options.attributeName}`]: attributes[this.options.attributeName],
                            }
                            if (this.options.setIdAttribute) {
                                return {
                                    ...defaultIdAttributes,
                                    id: attributes[this.options.attributeName],
                                }
                            } else {
                                return defaultIdAttributes
                            }
                        },
                    },
                },
            },
        ]
    },

    /**
     * 添加ProseMirror插件
     *
     * 该插件负责：
     * 1. 在文档变更时为新节点生成唯一ID
     * 2. 处理拖拽事件以重置被拖拽节点的ID
     * 3. 处理粘贴事件，过滤掉粘贴内容的ID以避免重复
     */
    addProseMirrorPlugins() {
        let dragSourceElement: any = null
        let transformPasted = false
        return [
            new Plugin({
                key: new PluginKey('uniqueID'),
                appendTransaction: (transactions, oldState, newState) => {
                    const docChanges = transactions.some(transaction => transaction.docChanged) && !oldState.doc.eq(newState.doc)
                    const filterTransactions =
                        this.options.filterTransaction &&
                        transactions.some(tr => {
                            let _a, _b
                            return !((_b = (_a = this.options as any).filterTransaction) === null || _b === void 0 ? void 0 : _b.call(_a, tr))
                        })
                    if (!docChanges || filterTransactions) {
                        return
                    }
                    const { tr } = newState
                    const { types, attributeName, generateID } = this.options as { types: string[]; attributeName: string; generateID: () => string }
                    const transform = combineTransactionSteps(oldState.doc, transactions as any)
                    const { mapping } = transform
                    // 基于旧状态获取变更范围
                    const changes = getChangedRanges(transform)

                    changes.forEach(({ newRange }) => {
                        const newNodes = findChildrenInRange(newState.doc, newRange, node => {
                            return types.includes(node.type.name)
                        })
                        const newIds = newNodes.map(({ node }) => node.attrs[attributeName]).filter(id => id !== null)
                        const duplicatedNewIds = findDuplicates(newIds)
                        newNodes.forEach(({ node, pos }) => {
                            let _a
                            const id = (_a = tr.doc.nodeAt(pos)) === null || _a === void 0 ? void 0 : _a.attrs[attributeName]
                            if (id === null) {
                                const initialDoc = oldState.doc.type.createAndFill()!.content
                                const wasInitial = oldState.doc.content.findDiffStart(initialDoc) === null

                                if (wasInitial) {
                                    const jsonNode = JSON.parse(JSON.stringify(newState.doc.toJSON()))
                                    jsonNode.content[0].content[0].attrs.id = 'initialBlockId'
                                    if (JSON.stringify(jsonNode.content) === JSON.stringify(initialDoc.toJSON())) {
                                        tr.setNodeMarkup(pos, undefined, {
                                            ...node.attrs,
                                            [attributeName]: 'initialBlockId',
                                        })
                                        return
                                    }
                                }

                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    [attributeName]: generateID(),
                                })
                                return
                            }
                            const { deleted } = mapping.invert().mapResult(pos)
                            const newNode = deleted && duplicatedNewIds.includes(id)
                            if (newNode) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    [attributeName]: generateID(),
                                })
                            }
                        })
                    })
                    if (!tr.steps.length) {
                        return
                    }
                    return tr
                },
                view(view) {
                    const handleDragstart = (event: any) => {
                        let _a
                        dragSourceElement = ((_a = view.dom.parentElement) === null || _a === void 0 ? void 0 : _a.contains(event.target))
                            ? view.dom.parentElement
                            : null
                    }
                    window.addEventListener('dragstart', handleDragstart)
                    return {
                        destroy() {
                            window.removeEventListener('dragstart', handleDragstart)
                        },
                    }
                },
                props: {
                    handleDOMEvents: {
                        drop: (view, event: any) => {
                            let _a
                            if (
                                dragSourceElement !== view.dom.parentElement ||
                                ((_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.effectAllowed) === 'copy'
                            ) {
                                dragSourceElement = null
                                transformPasted = true
                            }
                            return false
                        },
                        paste: () => {
                            transformPasted = true
                            return false
                        },
                    },
                    /**
                     * 转换粘贴内容，过滤掉指定类型节点的ID
                     * 这确保粘贴操作不会产生重复的ID
                     */
                    transformPasted: slice => {
                        if (!transformPasted) {
                            return slice
                        }
                        const { types, attributeName } = this.options as { types: string[]; attributeName: string }
                        const removeId = (fragment: any) => {
                            const list: any[] = []
                            fragment.forEach((node: any) => {
                                if (node.isText) {
                                    list.push(node)
                                    return
                                }
                                if (!types.includes(node.type.name)) {
                                    list.push(node.copy(removeId(node.content)))
                                    return
                                }
                                const nodeWithoutId = node.type.create(
                                    {
                                        ...node.attrs,
                                        [attributeName]: null,
                                    },
                                    removeId(node.content),
                                    node.marks
                                )
                                list.push(nodeWithoutId)
                            })
                            return Fragment.from(list)
                        }
                        transformPasted = false
                        return new Slice(removeId(slice.content), slice.openStart, slice.openEnd)
                    },
                },
            }),
        ]
    },
})

export { UniqueID as default, UniqueID }
