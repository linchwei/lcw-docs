/**
 * Markdown 导出器
 *
 * 该文件提供将块导出为 Markdown 格式的功能。
 * 使用 unified 工具链将 HTML 转换为 Markdown。
 */
import { Schema } from 'prosemirror-model'

import { PartialBlock } from '../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { esmDependencies, initializeESMDependencies } from '../../../util/esmDependencies'
import { createExternalHTMLExporter } from '../html/externalHTMLExporter'
import { removeUnderlines } from './removeUnderlinesRehypePlugin'
import { addSpacesToCheckboxes } from './util/addSpacesToCheckboxesRehypePlugin'

/**
 * 清理 HTML 并转换为 Markdown
 *
 * 将干净的 HTML 字符串转换为 Markdown 格式。
 * 在转换前会移除下划线（Markdown 不支持下划线），
 * 并为复选框添加空格以确保正确的 Markdown 语法。
 *
 * @param cleanHTMLString - 干净的 HTML 字符串
 * @returns 返回 Markdown 字符串
 */
export function cleanHTMLToMarkdown(cleanHTMLString: string) {
    const deps = esmDependencies

    if (!deps) {
        throw new Error('cleanHTMLToMarkdown requires ESM dependencies to be initialized')
    }

    const markdownString = deps.unified
        .unified()
        .use(deps.rehypeParse.default, { fragment: true })
        .use(removeUnderlines)
        .use(addSpacesToCheckboxes)
        .use(deps.rehypeRemark.default)
        .use(deps.remarkGfm.default)
        .use(deps.remarkStringify.default, {
            handlers: { text: node => node.value },
        })
        .processSync(cleanHTMLString)

    return markdownString.value as string
}

/**
 * 将块转换为 Markdown
 *
 * 异步函数，将块数组转换为 Markdown 格式字符串。
 *
 * @param blocks - 块数组
 * @param schema - ProseMirror schema
 * @param editor - 编辑器实例
 * @param options - 选项配置
 * @returns 返回 Markdown 字符串
 */
export async function blocksToMarkdown<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    blocks: PartialBlock<BSchema, I, S>[],
    schema: Schema,
    editor: LcwDocEditor<BSchema, I, S>,
    options: { document?: Document }
): Promise<string> {
    await initializeESMDependencies()
    const exporter = createExternalHTMLExporter(schema, editor)
    const externalHTML = exporter.exportBlocks(blocks, options)

    return cleanHTMLToMarkdown(externalHTML)
}