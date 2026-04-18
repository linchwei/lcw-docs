/**
 * 节点转块
 *
 * 该文件提供将 ProseMirror 节点转换为块数据结构的功能。
 * 支持将各种节点类型（文本、链接、表格等）转换回块格式。
 */
import { Mark, Node } from '@tiptap/pm/model'

import type { Block } from '../../blocks/defaultBlocks'
import UniqueID from '../../extensions/UniqueID/UniqueID'
import type {
    BlockSchema,
    CustomInlineContentConfig,
    CustomInlineContentFromConfig,
    InlineContent,
    InlineContentFromConfig,
    InlineContentSchema,
    Styles,
    StyleSchema,
    TableContent,
} from '../../schema/index'
import { isLinkInlineContent, isStyledTextInlineContent } from '../../schema/inlineContent/types'
import { UnreachableCaseError } from '../../util/typescript'
import { getBlockInfoWithManualOffset } from '../getBlockInfoFromPos'

/**
 * 将内容节点转换为表格内容
 *
 * 解析表格节点的行和单元格，提取列宽度和单元格内容。
 *
 * @param contentNode - 表格内容节点
 * @param inlineContentSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @returns 返回表格内容对象
 */
export function contentNodeToTableContent<I extends InlineContentSchema, S extends StyleSchema>(
    contentNode: Node,
    inlineContentSchema: I,
    styleSchema: S
) {
    const ret: TableContent<I, S> = {
        type: 'tableContent',
        columnWidths: [],
        rows: [],
    }

    contentNode.content.forEach((rowNode, _offset, index) => {
        const row: TableContent<I, S>['rows'][0] = {
            cells: [],
        }

        if (index === 0) {
            rowNode.content.forEach(cellNode => {
                ret.columnWidths.push(cellNode.attrs.colwidth?.[0] || undefined)
            })
        }

        rowNode.content.forEach(cellNode => {
            row.cells.push(contentNodeToInlineContent(cellNode.firstChild!, inlineContentSchema, styleSchema))
        })

        ret.rows.push(row)
    })

    return ret
}

/**
 * 将内容节点转换为内联内容
 *
 * 遍历内容节点，将文本、链接、硬换行等转换为内联内容格式。
 * 处理连续相同样式的文本合并。
 *
 * @param contentNode - 内容节点
 * @param inlineContentSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @returns 返回内联内容数组
 */
export function contentNodeToInlineContent<I extends InlineContentSchema, S extends StyleSchema>(
    contentNode: Node,
    inlineContentSchema: I,
    styleSchema: S
) {
    const content: InlineContent<any, S>[] = []
    let currentContent: InlineContent<any, S> | undefined = undefined

    contentNode.content.forEach(node => {
        if (node.type.name === 'hardBreak') {
            if (currentContent) {
                if (isStyledTextInlineContent(currentContent)) {
                    currentContent.text += '\n'
                } else if (isLinkInlineContent(currentContent)) {
                    currentContent.content[currentContent.content.length - 1].text += '\n'
                } else {
                    throw new Error('unexpected')
                }
            } else {
                currentContent = {
                    type: 'text',
                    text: '\n',
                    styles: {},
                }
            }

            return
        }

        if (node.type.name !== 'link' && node.type.name !== 'text' && inlineContentSchema[node.type.name]) {
            if (currentContent) {
                content.push(currentContent)
                currentContent = undefined
            }

            content.push(nodeToCustomInlineContent(node, inlineContentSchema, styleSchema))

            return
        }

        const styles: Styles<S> = {}
        let linkMark: Mark | undefined

        for (const mark of node.marks) {
            if (mark.type.name === 'link') {
                linkMark = mark
            } else {
                const config = styleSchema[mark.type.name]
                if (!config) {
                    throw new Error(`style ${mark.type.name} not found in styleSchema`)
                }
                if (config.propSchema === 'boolean') {
                    ;(styles as any)[config.type] = true
                } else if (config.propSchema === 'string') {
                    ;(styles as any)[config.type] = mark.attrs.stringValue
                } else {
                    throw new UnreachableCaseError(config.propSchema)
                }
            }
        }

        if (currentContent) {
            if (isStyledTextInlineContent(currentContent)) {
                if (!linkMark) {
                    if (JSON.stringify(currentContent.styles) === JSON.stringify(styles)) {
                        currentContent.text += node.textContent
                    } else {
                        content.push(currentContent)
                        currentContent = {
                            type: 'text',
                            text: node.textContent,
                            styles,
                        }
                    }
                } else {
                    content.push(currentContent)
                    currentContent = {
                        type: 'link',
                        href: linkMark.attrs.href,
                        content: [
                            {
                                type: 'text',
                                text: node.textContent,
                                styles,
                            },
                        ],
                    }
                }
            } else if (isLinkInlineContent(currentContent)) {
                if (linkMark) {
                    if (currentContent.href === linkMark.attrs.href) {
                        if (JSON.stringify(currentContent.content[currentContent.content.length - 1].styles) === JSON.stringify(styles)) {
                            currentContent.content[currentContent.content.length - 1].text += node.textContent
                        } else {
                            currentContent.content.push({
                                type: 'text',
                                text: node.textContent,
                                styles,
                            })
                        }
                    } else {
                        content.push(currentContent)
                        currentContent = {
                            type: 'link',
                            href: linkMark.attrs.href,
                            content: [
                                {
                                    type: 'text',
                                    text: node.textContent,
                                    styles,
                                },
                            ],
                        }
                    }
                } else {
                    content.push(currentContent)
                    currentContent = {
                        type: 'text',
                        text: node.textContent,
                        styles,
                    }
                }
            }
        } else {
            if (!linkMark) {
                currentContent = {
                    type: 'text',
                    text: node.textContent,
                    styles,
                }
            } else {
                currentContent = {
                    type: 'link',
                    href: linkMark.attrs.href,
                    content: [
                        {
                            type: 'text',
                            text: node.textContent,
                            styles,
                        },
                    ],
                }
            }
        }
    })

    if (currentContent) {
        content.push(currentContent)
    }

    return content as InlineContent<I, S>[]
}

/**
 * 将节点转换为自定义内联内容
 *
 * 根据内联内容 schema 将节点属性和内容提取出来。
 *
 * @param node - 节点
 * @param inlineContentSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @returns 返回自定义内联内容
 */
export function nodeToCustomInlineContent<I extends InlineContentSchema, S extends StyleSchema>(
    node: Node,
    inlineContentSchema: I,
    styleSchema: S
): InlineContent<I, S> {
    if (node.type.name === 'text' || node.type.name === 'link') {
        throw new Error('unexpected')
    }
    const props: any = {}
    const icConfig = inlineContentSchema[node.type.name] as CustomInlineContentConfig
    for (const [attr, value] of Object.entries(node.attrs)) {
        if (!icConfig) {
            throw Error('ic node is of an unrecognized type: ' + node.type.name)
        }

        const propSchema = icConfig.propSchema

        if (attr in propSchema) {
            props[attr] = value
        }
    }

    let content: CustomInlineContentFromConfig<any, any>['content']

    if (icConfig.content === 'styled') {
        content = contentNodeToInlineContent(node, inlineContentSchema, styleSchema) as any
    } else {
        content = undefined
    }

    const ic = {
        type: node.type.name,
        props,
        content,
    } as InlineContentFromConfig<I[keyof I], S>
    return ic
}

/**
 * 将节点转换为块
 *
 * 将 ProseMirror 的 blockContainer 节点转换为块数据结构。
 * 支持缓存机制以提高性能。
 *
 * @param node - blockContainer 节点
 * @param blockSchema - 块 schema
 * @param inlineContentSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @param blockCache - 可选的块缓存 WeakMap
 * @returns 返回块对象
 */
export function nodeToBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    node: Node,
    blockSchema: BSchema,
    inlineContentSchema: I,
    styleSchema: S,
    blockCache?: WeakMap<Node, Block<BSchema, I, S>>
): Block<BSchema, I, S> {
    if (node.type.name !== 'blockContainer') {
        throw Error('Node must be of type blockContainer, but is of type' + node.type.name + '.')
    }

    const cachedBlock = blockCache?.get(node)

    if (cachedBlock) {
        return cachedBlock
    }

    const { blockContainer, blockContent, blockGroup } = getBlockInfoWithManualOffset(node, 0)

    let id = blockContainer.node.attrs.id

    if (id === null) {
        id = UniqueID.options.generateID()
    }

    const props: any = {}
    for (const [attr, value] of Object.entries({
        ...node.attrs,
        ...blockContent.node.attrs,
    })) {
        const blockSpec = blockSchema[blockContent.node.type.name]

        if (!blockSpec) {
            throw Error('Block is of an unrecognized type: ' + blockContent.node.type.name)
        }

        const propSchema = blockSpec.propSchema

        if (attr in propSchema) {
            props[attr] = value
        }
    }

    const blockConfig = blockSchema[blockContent.node.type.name]

    const children: Block<BSchema, I, S>[] = []
    blockGroup?.node.forEach(child => {
        children.push(nodeToBlock(child, blockSchema, inlineContentSchema, styleSchema, blockCache))
    })

    let content: Block<any, any, any>['content']

    if (blockConfig.content === 'inline') {
        content = contentNodeToInlineContent(blockContent.node, inlineContentSchema, styleSchema)
    } else if (blockConfig.content === 'table') {
        content = contentNodeToTableContent(blockContent.node, inlineContentSchema, styleSchema)
    } else if (blockConfig.content === 'none') {
        content = undefined
    } else {
        throw new UnreachableCaseError(blockConfig.content)
    }

    const block = {
        id,
        type: blockConfig.type,
        props,
        content,
        children,
    } as Block<BSchema, I, S>

    blockCache?.set(node, block)

    return block
}