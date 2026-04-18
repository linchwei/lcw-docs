/**
 * 序列化块为外部 HTML 工具
 *
 * 该文件提供将块序列化为外部 HTML 片段的核心功能。
 * 外部 HTML 是干净的、可在编辑器外部使用的 HTML 格式。
 */
import { DOMSerializer, Fragment } from 'prosemirror-model'

import { PartialBlock } from '../../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { UnreachableCaseError } from '../../../../util/typescript'
import { inlineContentToNodes, tableContentToNodes } from '../../../nodeConversions/blockToNode'

/**
 * 添加属性并移除 CSS 类
 *
 * 保留非 bn- 前缀的 CSS 类，移除其他类名。
 *
 * @param element - HTML 元素
 */
function addAttributesAndRemoveClasses(element: HTMLElement) {
    const className = [...element.classList].filter(className => !className.startsWith('bn-')) || []

    if (className.length > 0) {
        element.className = className.join(' ')
    } else {
        element.removeAttribute('class')
    }
}

/**
 * 将内联内容序列化为外部 HTML
 *
 * 将块的内联内容（文本、链接等）转换为 DOM 片段。
 *
 * @param editor - 编辑器实例
 * @param blockContent - 块内容
 * @param serializer - DOM 序列化器
 * @param options - 选项配置
 * @returns 返回序列化的 DOM 片段
 */
export function serializeInlineContentExternalHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
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

    if (dom.nodeType === 1) {
        addAttributesAndRemoveClasses(dom as HTMLElement)
    }

    return dom
}

/**
 * 序列化单个块
 *
 * 将块转换为外部 HTML 元素，处理列表结构。
 *
 * @param fragment - 文档片段
 * @param editor - 编辑器实例
 * @param block - 要序列化的块
 * @param serializer - DOM 序列化器
 * @param orderedListItemBlockTypes - 有序列表块类型集合
 * @param unorderedListItemBlockTypes - 无序列表块类型集合
 * @param options - 选项配置
 */
function serializeBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    fragment: DocumentFragment,
    editor: LcwDocEditor<BSchema, I, S>,
    block: PartialBlock<BSchema, I, S>,
    serializer: DOMSerializer,
    orderedListItemBlockTypes: Set<string>,
    unorderedListItemBlockTypes: Set<string>,
    options?: { document?: Document }
) {
    const doc = options?.document ?? document
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

    const attrs = [...bc.dom.attributes]

    const ret = editor.blockImplementations[block.type as any].implementation.toExternalHTML({ ...block, props } as any, editor as any)

    const elementFragment = doc.createDocumentFragment()
    if (ret.dom.classList.contains('bn-block-content')) {
        const blockContentDataAttributes = [...attrs, ...ret.dom.attributes].filter(
            attr =>
                attr.name.startsWith('data') &&
                attr.name !== 'data-content-type' &&
                attr.name !== 'data-file-block' &&
                attr.name !== 'data-node-view-wrapper' &&
                attr.name !== 'data-node-type' &&
                attr.name !== 'data-id' &&
                attr.name !== 'data-index' &&
                attr.name !== 'data-editable'
        )

        for (const attr of blockContentDataAttributes) {
            ;(ret.dom.firstChild! as HTMLElement).setAttribute(attr.name, attr.value)
        }

        addAttributesAndRemoveClasses(ret.dom.firstChild! as HTMLElement)
        elementFragment.append(...ret.dom.childNodes)
    } else {
        elementFragment.append(ret.dom)
    }

    if (ret.contentDOM && block.content) {
        const ic = serializeInlineContentExternalHTML(editor, block.content as any, serializer, options)

        ret.contentDOM.appendChild(ic)
    }

    let listType = undefined
    if (orderedListItemBlockTypes.has(block.type!)) {
        listType = 'OL'
    } else if (unorderedListItemBlockTypes.has(block.type!)) {
        listType = 'UL'
    }

    if (listType) {
        if (fragment.lastChild?.nodeName !== listType) {
            const list = doc.createElement(listType)
            fragment.append(list)
        }
        const li = doc.createElement('li')
        li.append(elementFragment)
        fragment.lastChild!.appendChild(li)
    } else {
        fragment.append(elementFragment)
    }

    if (block.children && block.children.length > 0) {
        const childFragment = doc.createDocumentFragment()
        serializeBlocksToFragment(
            childFragment,
            editor,
            block.children,
            serializer,
            orderedListItemBlockTypes,
            unorderedListItemBlockTypes,
            options
        )
        if (fragment.lastChild?.nodeName === 'UL' || fragment.lastChild?.nodeName === 'OL') {
            while (childFragment.firstChild?.nodeName === 'UL' || childFragment.firstChild?.nodeName === 'OL') {
                fragment.lastChild!.lastChild!.appendChild(childFragment.firstChild!)
            }
        }

        fragment.append(childFragment)
    }
}

/**
 * 将块数组序列化到片段
 *
 * 遍历块数组并序列化每个块。
 *
 * @param fragment - 目标文档片段
 * @param editor - 编辑器实例
 * @param blocks - 块数组
 * @param serializer - DOM 序列化器
 * @param orderedListItemBlockTypes - 有序列表块类型集合
 * @param unorderedListItemBlockTypes - 无序列表块类型集合
 * @param options - 选项配置
 */
const serializeBlocksToFragment = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    fragment: DocumentFragment,
    editor: LcwDocEditor<BSchema, I, S>,
    blocks: PartialBlock<BSchema, I, S>[],
    serializer: DOMSerializer,
    orderedListItemBlockTypes: Set<string>,
    unorderedListItemBlockTypes: Set<string>,
    options?: { document?: Document }
) => {
    for (const block of blocks) {
        serializeBlock(fragment, editor, block, serializer, orderedListItemBlockTypes, unorderedListItemBlockTypes, options)
    }
}

/**
 * 序列化块为外部 HTML 片段
 *
 * 主入口函数，将块数组序列化为外部可用的 HTML 片段。
 *
 * @param editor - 编辑器实例
 * @param blocks - 块数组
 * @param serializer - DOM 序列化器
 * @param orderedListItemBlockTypes - 有序列表块类型集合
 * @param unorderedListItemBlockTypes - 无序列表块类型集合
 * @param options - 选项配置
 * @returns 返回文档片段
 */
export const serializeBlocksExternalHTML = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocks: PartialBlock<BSchema, I, S>[],
    serializer: DOMSerializer,
    orderedListItemBlockTypes: Set<string>,
    unorderedListItemBlockTypes: Set<string>,
    options?: { document?: Document }
) => {
    const doc = options?.document ?? document
    const fragment = doc.createDocumentFragment()

    serializeBlocksToFragment(fragment, editor, blocks, serializer, orderedListItemBlockTypes, unorderedListItemBlockTypes, options)
    return fragment
}