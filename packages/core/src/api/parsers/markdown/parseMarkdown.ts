/**
 * Markdown 解析
 *
 * 该文件提供将 Markdown 字符串解析为块数组的功能。
 * 使用 remark 解析 Markdown，使用 rehype 将其转换为 HTML，
 * 然后再转换为块数组。
 */
import { Schema } from 'prosemirror-model'

import { Block } from '../../../blocks/defaultBlocks'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { initializeESMDependencies } from '../../../util/esmDependencies'
import { HTMLToBlocks } from '../html/parseHTML'

/**
 * 处理代码块的转换函数
 *
 * 将 MDAST 的 code 节点转换为 HTML 的 pre 和 code 结构。
 * 支持设置代码语言。
 *
 * @param state - 处理状态
 * @param node - code 节点
 * @returns 返回转换后的元素节点
 */
function code(state: any, node: any) {
    const value = node.value ? node.value : ''
    const properties: any = {}

    if (node.lang) {
        properties['data-language'] = node.lang
    }

    let result: any = {
        type: 'element',
        tagName: 'code',
        properties,
        children: [{ type: 'text', value }],
    }

    if (node.meta) {
        result.data = { meta: node.meta }
    }

    state.patch(node, result)
    result = state.applyData(node, result)

    result = {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [result],
    }
    state.patch(node, result)
    return result
}

/**
 * 将 Markdown 转换为块数组
 *
 * 异步函数，使用 unified/remark/rehype 工具链将 Markdown 解析为块。
 * 支持 GFM（GitHub Flavored Markdown）和代码块语法。
 *
 * @param markdown - Markdown 字符串
 * @param blockSchema - 块 schema
 * @param icSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @param pmSchema - ProseMirror schema
 * @returns 返回解析后的块数组
 */
export async function markdownToBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    markdown: string,
    blockSchema: BSchema,
    icSchema: I,
    styleSchema: S,
    pmSchema: Schema
): Promise<Block<BSchema, I, S>[]> {
    const deps = await initializeESMDependencies()
    const htmlString = deps.unified
        .unified()
        .use(deps.remarkParse.default)
        .use(deps.remarkGfm.default)
        .use(deps.remarkRehype.default, {
            handlers: {
                ...(deps.remarkRehype.defaultHandlers as any),
                code,
            },
        })
        .use(deps.rehypeStringify.default)
        .processSync(markdown)

    return HTMLToBlocks(htmlString.value as string, blockSchema, icSchema, styleSchema, pmSchema)
}