/**
 * LcwDocSchema.ts
 *
 * Schema 配置管理模块，负责创建和管理编辑器的 Schema。
 * Schema 定义了编辑器支持的区块类型、内联内容类型和样式类型，
 * 以及它们之间的转换规则。
 */

import { defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '../blocks/defaultBlocks'
import type { BlockNoDefaults, PartialBlockNoDefaults } from '../schema/blocks/types'
import {
    BlockSchema,
    BlockSchemaFromSpecs,
    BlockSpecs,
    getBlockSchemaFromSpecs,
    getInlineContentSchemaFromSpecs,
    getStyleSchemaFromSpecs,
    InlineContentSchema,
    InlineContentSchemaFromSpecs,
    InlineContentSpecs,
    StyleSchema,
    StyleSchemaFromSpecs,
    StyleSpecs,
} from '../schema/index'
import type { LcwDocEditor } from './LcwDocEditor'

/**
 * 从对象中移除 undefined 值
 *
 * @param obj - 输入对象
 * @returns 移除 undefined 值后的新对象
 */
function removeUndefined<T extends Record<string, any> | undefined>(obj: T): T {
    if (!obj) {
        return obj
    }
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}

/**
 * LcwDocSchema 类
 *
 * 管理编辑器的所有 Schema 配置，包括：
 * - 区块类型规格 (blockSpecs)
 * - 内联内容类型规格 (inlineContentSpecs)
 * - 样式类型规格 (styleSpecs)
 *
 * 以及从规格派生的实际 Schema 对象。
 *
 * @typeParam BSchema - 区块 Schema 类型
 * @typeParam ISchema - 内联内容 Schema 类型
 * @typeParam SSchema - 样式 Schema 类型
 */
export class LcwDocSchema<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> {
    /**
     * 区块类型规格映射
     */
    public readonly blockSpecs: BlockSpecs

    /**
     * 内联内容类型规格映射
     */
    public readonly inlineContentSpecs: InlineContentSpecs

    /**
     * 样式类型规格映射
     */
    public readonly styleSpecs: StyleSpecs

    /**
     * 区块 Schema
     */
    public readonly blockSchema: BSchema

    /**
     * 内联内容 Schema
     */
    public readonly inlineContentSchema: ISchema

    /**
     * 样式 Schema
     */
    public readonly styleSchema: SSchema

    /**
     * LcwDocEditor 类型引用（仅用于类型推断）
     */
    public readonly LcwDocEditor: LcwDocEditor<BSchema, ISchema, SSchema> = 'only for types' as any

    /**
     * Block 类型引用（仅用于类型推断）
     */
    public readonly Block: BlockNoDefaults<BSchema, ISchema, SSchema> = 'only for types' as any

    /**
     * PartialBlock 类型引用（仅用于类型推断）
     */
    public readonly PartialBlock: PartialBlockNoDefaults<BSchema, ISchema, SSchema> = 'only for types' as any

    /**
     * 创建 LcwDocSchema 实例的静态工厂方法
     *
     * @param options - 可选的规格配置
     * @param options.blockSpecs - 自定义区块规格
     * @param options.inlineContentSpecs - 自定义内联内容规格
     * @param options.styleSpecs - 自定义样式规格
     * @returns 新的 LcwDocSchema 实例
     */
    public static create<
        BSpecs extends BlockSpecs = typeof defaultBlockSpecs,
        ISpecs extends InlineContentSpecs = typeof defaultInlineContentSpecs,
        SSpecs extends StyleSpecs = typeof defaultStyleSpecs,
    >(options?: { blockSpecs?: BSpecs; inlineContentSpecs?: ISpecs; styleSpecs?: SSpecs }) {
        return new LcwDocSchema<BlockSchemaFromSpecs<BSpecs>, InlineContentSchemaFromSpecs<ISpecs>, StyleSchemaFromSpecs<SSpecs>>(options)
    }

    /**
     * 构造函数
     *
     * @param opts - 可选的规格配置
     */
    constructor(opts?: { blockSpecs?: BlockSpecs; inlineContentSpecs?: InlineContentSpecs; styleSpecs?: StyleSpecs }) {
        // 使用提供的规格或默认规格，移除 undefined 值
        this.blockSpecs = removeUndefined(opts?.blockSpecs) || defaultBlockSpecs
        this.inlineContentSpecs = removeUndefined(opts?.inlineContentSpecs) || defaultInlineContentSpecs
        this.styleSpecs = removeUndefined(opts?.styleSpecs) || defaultStyleSpecs

        // 从规格派生出实际的 Schema
        this.blockSchema = getBlockSchemaFromSpecs(this.blockSpecs) as any
        this.inlineContentSchema = getInlineContentSchemaFromSpecs(this.inlineContentSpecs) as any
        this.styleSchema = getStyleSchemaFromSpecs(this.styleSpecs) as any
    }
}
