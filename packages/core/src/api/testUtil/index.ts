/**
 * 测试工具
 *
 * 该目录提供用于测试编辑器的工具函数和测试用例定义。
 */
import { PartialBlock } from '../../blocks/defaultBlocks'
import { LcwDocEditor } from '../../editor/LcwDocEditor'
import { BlockSchema } from '../../schema/blocks/types'
import { InlineContentSchema } from '../../schema/inlineContent/types'
import { StyleSchema } from '../../schema/styles/types'
import { NoInfer } from '../../util/typescript'

/**
 * 编辑器测试用例类型
 *
 * 定义测试用例的结构，包含编辑器创建函数和测试文档数组。
 */
export type EditorTestCases<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    /** 测试用例名称 */
    name: string
    /** 创建编辑器实例的函数 */
    createEditor: () => LcwDocEditor<B, I, S>
    /** 测试文档数组 */
    documents: Array<{
        /** 文档名称 */
        name: string
        /** 块的数组 */
        blocks: PartialBlock<NoInfer<B>, NoInfer<I>, NoInfer<S>>[]
    }>
}