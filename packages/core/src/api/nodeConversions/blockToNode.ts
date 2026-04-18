/**
 * 块转节点
 *
 * 该文件提供将块数据结构转换为 ProseMirror 节点的功能。
 * 支持将各种类型的内联内容（文本、链接、样式等）转换为节点。
 */
import { Mark, Node, Schema } from '@tiptap/pm/model'

import type { PartialBlock } from '../../blocks/defaultBlocks'
import UniqueID from '../../extensions/UniqueID/UniqueID'
import type {
    InlineContentSchema,
    PartialCustomInlineContentFromConfig,
    PartialInlineContent,
    PartialLink,
    PartialTableContent,
    StyledText,
    StyleSchema,
} from '../../schema'
import { isPartialLinkInlineContent, isStyledTextInlineContent } from '../../schema/inlineContent/types'
import { UnreachableCaseError } from '../../util/typescript'

/**
 * 将带样式的文本转换为节点数组
 *
 * 处理文本内容和文本上的样式标记（如加粗、斜体等）。
 * 将换行符转换为硬换行节点。
 *
 * @param styledText - 带样式的文本对象
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回节点数组
 */
function styledTextToNodes<T extends StyleSchema>(styledText: StyledText<T>, schema: Schema, styleSchema: T): Node[] {
    const marks: Mark[] = []

    for (const [style, value] of Object.entries(styledText.styles)) {
        const config = styleSchema[style]
        if (!config) {
            throw new Error(`style ${style} not found in styleSchema`)
        }

        if (config.propSchema === 'boolean') {
            marks.push(schema.mark(style))
        } else if (config.propSchema === 'string') {
            marks.push(schema.mark(style, { stringValue: value }))
        } else {
            throw new UnreachableCaseError(config.propSchema)
        }
    }

    return styledText.text
        .split(/(\n)/g)
        .filter(text => text.length > 0)
        .map(text => {
            if (text === '\n') {
                return schema.nodes['hardBreak'].create()
            } else {
                return schema.text(text, marks)
            }
        })
}

/**
 * 将链接转换为节点数组
 *
 * 将链接内容转换为带有链接标记的文本节点。
 *
 * @param link - 链接对象
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回节点数组
 */
function linkToNodes(link: PartialLink<StyleSchema>, schema: Schema, styleSchema: StyleSchema): Node[] {
    const linkMark = schema.marks.link.create({
        href: link.href,
    })

    return styledTextArrayToNodes(link.content, schema, styleSchema).map(node => {
        if (node.type.name === 'text') {
            return node.mark([...node.marks, linkMark])
        }

        if (node.type.name === 'hardBreak') {
            return node
        }
        throw new Error('unexpected node type')
    })
}

/**
 * 将文本数组转换为节点数组
 *
 * 处理字符串或带样式文本数组的统一转换。
 *
 * @param content - 字符串或带样式文本数组
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回节点数组
 */
function styledTextArrayToNodes<S extends StyleSchema>(content: string | StyledText<S>[], schema: Schema, styleSchema: S): Node[] {
    const nodes: Node[] = []

    if (typeof content === 'string') {
        nodes.push(...styledTextArrayToNodes<S>([{ type: 'text', text: content, styles: {} }], schema, styleSchema))
        return nodes
    }

    for (const styledText of content) {
        nodes.push(...styledTextToNodes(styledText, schema, styleSchema))
    }
    return nodes
}

/**
 * 将内联内容转换为节点数组
 *
 * 支持多种内联内容类型：纯文本、链接、带样式的文本、自定义内联内容。
 *
 * @param blockContent - 内联内容数组
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回节点数组
 */
export function inlineContentToNodes<I extends InlineContentSchema, S extends StyleSchema>(
    blockContent: PartialInlineContent<I, S>,
    schema: Schema,
    styleSchema: S
): Node[] {
    const nodes: Node[] = []

    for (const content of blockContent) {
        if (typeof content === 'string') {
            nodes.push(...styledTextArrayToNodes(content, schema, styleSchema))
        } else if (isPartialLinkInlineContent(content)) {
            nodes.push(...linkToNodes(content, schema, styleSchema))
        } else if (isStyledTextInlineContent(content)) {
            nodes.push(...styledTextArrayToNodes([content], schema, styleSchema))
        } else {
            nodes.push(blockOrInlineContentToContentNode(content, schema, styleSchema))
        }
    }
    return nodes
}

/**
 * 将表格内容转换为节点数组
 *
 * 将表格内容结构转换为表格行和单元格节点。
 *
 * @param tableContent - 表格内容对象
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回表格节点数组
 */
export function tableContentToNodes<I extends InlineContentSchema, S extends StyleSchema>(
    tableContent: PartialTableContent<I, S>,
    schema: Schema,
    styleSchema: StyleSchema
): Node[] {
    const rowNodes: Node[] = []

    for (const row of tableContent.rows) {
        const columnNodes: Node[] = []
        for (let i = 0; i < row.cells.length; i++) {
            const cell = row.cells[i]
            let pNode: Node
            if (!cell) {
                pNode = schema.nodes['tableParagraph'].create({})
            } else if (typeof cell === 'string') {
                pNode = schema.nodes['tableParagraph'].create({}, schema.text(cell))
            } else {
                const textNodes = inlineContentToNodes(cell, schema, styleSchema)
                pNode = schema.nodes['tableParagraph'].create({}, textNodes)
            }

            const cellNode = schema.nodes['tableCell'].create(
                {
                    colwidth: tableContent.columnWidths?.[i] ? [tableContent.columnWidths[i]] : null,
                },
                pNode
            )
            columnNodes.push(cellNode)
        }
        const rowNode = schema.nodes['tableRow'].create({}, columnNodes)
        rowNodes.push(rowNode)
    }
    return rowNodes
}

/**
 * 将块或内联内容转换为内容节点
 *
 * 内部函数，根据内容类型创建相应的 schema 节点。
 *
 * @param block - 块或内联内容
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回内容节点
 */
function blockOrInlineContentToContentNode(
    block: PartialBlock<any, any, any> | PartialCustomInlineContentFromConfig<any, any>,
    schema: Schema,
    styleSchema: StyleSchema
) {
    let contentNode: Node
    let type = block.type

    if (type === undefined) {
        type = 'paragraph'
    }

    if (!schema.nodes[type]) {
        throw new Error(`node type ${type} not found in schema`)
    }

    if (!block.content) {
        contentNode = schema.nodes[type].create(block.props)
    } else if (typeof block.content === 'string') {
        const nodes = inlineContentToNodes([block.content], schema, styleSchema)
        contentNode = schema.nodes[type].create(block.props, nodes)
    } else if (Array.isArray(block.content)) {
        const nodes = inlineContentToNodes(block.content, schema, styleSchema)
        contentNode = schema.nodes[type].create(block.props, nodes)
    } else if (block.content.type === 'tableContent') {
        const nodes = tableContentToNodes(block.content, schema, styleSchema)
        contentNode = schema.nodes[type].create(block.props, nodes)
    } else {
        throw new UnreachableCaseError(block.content.type)
    }
    return contentNode
}

/**
 * 将块转换为节点
 *
 * 将完整的块结构（包括内容、子块）转换为 ProseMirror 的 blockContainer 节点。
 * 如果块没有 ID，会自动生成一个唯一 ID。
 *
 * @param block - 要转换的块
 * @param schema - ProseMirror schema
 * @param styleSchema - 样式 schema
 * @returns 返回 blockContainer 节点
 */
export function blockToNode(block: PartialBlock<any, any, any>, schema: Schema, styleSchema: StyleSchema) {
    let id = block.id

    if (id === undefined) {
        id = UniqueID.options.generateID()
    }

    const contentNode = blockOrInlineContentToContentNode(block, schema, styleSchema)

    const children: Node[] = []

    if (block.children) {
        for (const child of block.children) {
            children.push(blockToNode(child, schema, styleSchema))
        }
    }

    const groupNode = schema.nodes['blockGroup'].create({}, children)

    return schema.nodes['blockContainer'].create(
        {
            id: id,
            ...block.props,
        },
        children.length > 0 ? [contentNode, groupNode] : contentNode
    )
}