/**
 * 表格块内容模块
 * 定义基于 TipTap 的表格块，包含表格行、单元格、表头等子节点
 * 支持表格的列宽调整、单元格编辑等核心功能
 */
import { Node } from '@tiptap/core'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { Node as PMNode } from 'prosemirror-model'
import { TableView } from 'prosemirror-tables'
import { ViewMutationRecord } from 'prosemirror-view'

import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from '../../schema/index'
import { mergeCSSClasses } from '../../util/browser'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultProps } from '../defaultProps'
import { EMPTY_CELL_WIDTH, TableExtension } from './TableExtension'

/**
 * 表格块的属性模式定义
 * 包含背景颜色和文字颜色两个可继承属性
 */
export const tablePropSchema = {
    backgroundColor: defaultProps.backgroundColor,
    textColor: defaultProps.textColor,
}

/**
 * 表格块的 TipTap 节点定义
 * 使用 createStronglyTypedTiptapNode 创建支持强类型的表格节点
 * 配置表格的内容结构、HTML 解析和渲染规则
 */
export const TableBlockContent = createStronglyTypedTiptapNode({
    name: 'table',
    content: 'tableRow+',
    group: 'blockContent',
    tableRole: 'table',

    isolating: true,

    parseHTML() {
        return [{ tag: 'table' }]
    },

    renderHTML({ HTMLAttributes }) {
        return createDefaultBlockDOMOutputSpec(
            this.name,
            'table',
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )
    },

    /**
     * 创建自定义的表格节点视图
     * 用于处理表格的 DOM 结构和交互行为
     */
    addNodeView() {
        return ({ node, HTMLAttributes }) => {
            /**
             * 自定义表格视图类
             * 继承自 ProseMirror 的 TableView
             * 用于管理表格块的 DOM 渲染和交互
             */
            class LcwDocTableView extends TableView {
                constructor(
                    public node: PMNode,
                    public cellMinWidth: number,
                    public blockContentHTMLAttributes: Record<string, string>
                ) {
                    super(node, cellMinWidth)

                    const blockContent = document.createElement('div')
                    blockContent.className = mergeCSSClasses('bn-block-content', blockContentHTMLAttributes.class)
                    blockContent.setAttribute('data-content-type', 'table')
                    for (const [attribute, value] of Object.entries(blockContentHTMLAttributes)) {
                        if (attribute !== 'class') {
                            blockContent.setAttribute(attribute, value)
                        }
                    }

                    const tableWrapper = this.dom

                    const tableWrapperInner = document.createElement('div')
                    tableWrapperInner.className = 'tableWrapper-inner'
                    tableWrapperInner.appendChild(tableWrapper.firstChild!)

                    tableWrapper.appendChild(tableWrapperInner)

                    blockContent.appendChild(tableWrapper)
                    const floatingContainer = document.createElement('div')
                    floatingContainer.className = 'table-widgets-container'
                    floatingContainer.style.position = 'relative'
                    tableWrapper.appendChild(floatingContainer)

                    this.dom = blockContent
                }

                /**
                 * 判断是否忽略 DOM 突变记录
                 * 用于优化表格编辑时的性能
                 */
                ignoreMutation(record: ViewMutationRecord): boolean {
                    return !(record.target as HTMLElement).closest('.tableWrapper-inner') || super.ignoreMutation(record)
                }
            }

            return new LcwDocTableView(node, EMPTY_CELL_WIDTH, {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            })
        }
    },
})

/**
 * 表格段落节点
 * 用于表格单元格内的段落内容
 * 支持保留空白字符和特殊的解析规则
 */
const TableParagraph = Node.create({
    name: 'tableParagraph',
    group: 'tableContent',
    content: 'inline*',

    parseHTML() {
        return [
            {
                preserveWhitespace: 'full',
                priority: 210,
                context: 'tableContent',
                tag: 'p',
                getAttrs: () => {
                    return {}
                },
            },
            {
                tag: 'p',
                getAttrs: element => {
                    if (typeof element === 'string' || !element.textContent) {
                        return false
                    }

                    const parent = element.parentElement

                    if (parent === null) {
                        return false
                    }

                    if (parent.tagName === 'TD') {
                        return {}
                    }

                    return false
                },
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['p', HTMLAttributes, 0]
    },
})

/**
 * 表格块完整定义
 * 组合 TableBlockContent、TableExtension、TableParagraph
 * 以及扩展的 TableHeader 和 TableCell 节点
 */
export const Table = createBlockSpecFromStronglyTypedTiptapNode(TableBlockContent, tablePropSchema, [
    TableExtension,
    TableParagraph,
    TableHeader.extend({
        content: 'tableContent',
    }),
    TableCell.extend({
        content: 'tableContent',
    }),
    TableRow,
])
