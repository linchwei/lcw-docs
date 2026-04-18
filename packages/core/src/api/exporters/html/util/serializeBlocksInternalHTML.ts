/**
 * 序列化块为内部 HTML 工具
 *
 * 该文件提供将块序列化为内部 HTML 的核心功能。
 * 内部 HTML 包含编辑器所需的所有属性和结构。
 */
import { DOMSerializer, Fragment } from 'prosemirror-model'

import { PartialBlock } from '../../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { UnreachableCaseError } from '../../../../util/typescript'
import { inlineContentToNodes, tableContentToNodes } from '../../../nodeConversions/blockToNode'

/**
 * 将内联内容序列化为内部 HTML
 *
 * 将块的内联内容转换为 DOM 片段，用于内部编辑。
 *
 * @param editor - 编辑器实例
 * @param blockContent - 块内容
 * @param serializer - DOM 序列化器
 * @param options - 选项配置
 * @returns 返回序列化的 DOM 片段
 */
export function serializeInlineContentInternalHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<any, I, S>,
    blockContent: PartialBlock<BSchema, I, S>['content'],
    serializer: DOMSerializer,
    options?: { document?: Document }
) {
    let nodes: any

    if (!blockContent) {
        throw new Error('blockContent is required')
    } else if (typeof blockContent === 'string') {
        nodes = inlineContentToNodes([blockContent], editor.pmSchema, editor.schema.styleSchema)
    } else if (Array.isArray(blockContent)) {
        nodes = inlineContentToNodes(blockContent, editor.pmSchema, editor.schema.styleSchema)
    } else if (blockContent.type === 'tableContent') {
        nodes = tableContentToNodes(blockContent, editor.pmSchema, editor.schema.styleSchema)
    } else {
        throw new UnreachableCaseError(blockContent.type)
    }

    const dom = serializer.serializeFragment(Fragment.from(nodes), options)

    return dom
}

/**
 * 序列化单个块
 *
 * 将块转换为内部 HTML 元素，包含编辑所需的属性。
 *
 * @param editor - 编辑器实例
 * @param block - 要序列化的块
 * @param serializer - DOM 序列化器
 * @param listIndex - 列表索引（用于有序列表）
 * @param options - 选项配置
 * @returns 返回 DOM 元素
 */
function serializeBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    block: PartialBlock<BSchema, I, S>,
    serializer: DOMSerializer,
    listIndex: number,
    options?: { document?: Document }
) {
    const BC_NODE = editor.pmSchema.nodes['blockContainer']

    let props = block.props
    if (!block.props) {
        props = {}
        for (const [name, spec] of Object.entries(editor.schema.blockSchema[block.type as any].propSchema)) {
            ;(props as any)[name] = spec.default
        }
    }

    const bc = BC_NODE.spec?.toDOM?.(
        BC_NODE.create({
            id: block.id,
            ...props,
        })
    ) as {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }

    const impl = editor.blockImplementations[block.type as any].implementation
    const ret = impl.toInternalHTML({ ...block, props } as any, editor as any)

    if (block.type === 'numberedListItem') {
        ret.dom.setAttribute('data-index', listIndex.toString())
    }

    if (ret.contentDOM && block.content) {
        const ic = serializeInlineContentInternalHTML(editor, block.content as any, serializer, options)
        ret.contentDOM.appendChild(ic)
    }

    bc.contentDOM?.appendChild(ret.dom)

    if (block.children && block.children.length > 0) {
        bc.contentDOM?.appendChild(serializeBlocksInternalHTML(editor, block.children, serializer, options))
    }
    return bc.dom
}

/**
 * 序列化块为内部 HTML
 *
 * 将块数组序列化为内部 HTML，包含编辑器所需的所有属性。
 *
 * @param editor - 编辑器实例
 * @param blocks - 块数组
 * @param serializer - DOM 序列化器
 * @param options - 选项配置
 * @returns 返回 DOM 元素
 */
export const serializeBlocksInternalHTML = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocks: PartialBlock<BSchema, I, S>[],
    serializer: DOMSerializer,
    options?: { document?: Document }
) => {
    const BG_NODE = editor.pmSchema.nodes['blockGroup']

    const bg = BG_NODE.spec!.toDOM!(BG_NODE.create({})) as {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }

    let listIndex = 0
    for (const block of blocks) {
        if (block.type === 'numberedListItem') {
            listIndex++
        } else {
            listIndex = 0
        }
        const blockDOM = serializeBlock(editor, block, serializer, listIndex, options)
        bg.contentDOM!.appendChild(blockDOM)
    }

    return bg.dom
}