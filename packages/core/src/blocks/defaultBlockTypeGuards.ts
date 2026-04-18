/**
 * 默认块类型守卫模块
 * 提供类型守卫函数用于在运行时检查块类型
 * 用于类型安全的块类型 narrowing
 */
import type { LcwDocEditor } from '../editor/LcwDocEditor'
import { BlockFromConfig, BlockSchema, FileBlockConfig, InlineContentSchema, StyleSchema } from '../schema/index'
import { Block, DefaultBlockSchema, defaultBlockSchema, DefaultInlineContentSchema, defaultInlineContentSchema } from './defaultBlocks'
import { defaultProps } from './defaultProps'

/**
 * 检查编辑器 schema 中是否包含指定的默认块类型
 * @param blockType - 要检查的块类型名称
 * @param editor - 编辑器实例
 * @returns 类型守卫结果，判断编辑器是否使用该默认块类型
 */
export function checkDefaultBlockTypeInSchema<
    BlockType extends keyof DefaultBlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(blockType: BlockType, editor: LcwDocEditor<any, I, S>): editor is LcwDocEditor<{ Type: DefaultBlockSchema[BlockType] }, I, S> {
    return blockType in editor.schema.blockSchema && editor.schema.blockSchema[blockType] === defaultBlockSchema[blockType]
}

/**
 * 检查编辑器 schema 中是否包含指定的默认内联内容类型
 * @param inlineContentType - 要检查的内联内容类型名称
 * @param editor - 编辑器实例
 * @returns 类型守卫结果
 */
export function checkDefaultInlineContentTypeInSchema<
    InlineContentType extends keyof DefaultInlineContentSchema,
    B extends BlockSchema,
    S extends StyleSchema,
>(
    inlineContentType: InlineContentType,
    editor: LcwDocEditor<B, any, S>
): editor is LcwDocEditor<B, { Type: DefaultInlineContentSchema[InlineContentType] }, S> {
    return (
        inlineContentType in editor.schema.inlineContentSchema &&
        editor.schema.inlineContentSchema[inlineContentType] === defaultInlineContentSchema[inlineContentType]
    )
}

/**
 * 检查块是否是指定的默认类型
 * @param blockType - 期望的块类型名称
 * @param block - 要检查的块
 * @param editor - 编辑器实例
 * @returns 类型守卫结果
 */
export function checkBlockIsDefaultType<BlockType extends keyof DefaultBlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    blockType: BlockType,
    block: Block<any, I, S>,
    editor: LcwDocEditor<any, I, S>
): block is BlockFromConfig<DefaultBlockSchema[BlockType], I, S> {
    return block.type === blockType && block.type in editor.schema.blockSchema && checkDefaultBlockTypeInSchema(block.type, editor)
}

/**
 * 检查块是否是文件块（包括图片、视频、音频等）
 * @param block - 要检查的块
 * @param editor - 编辑器实例
 * @returns 类型守卫结果
 */
export function checkBlockIsFileBlock<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    block: Block<any, I, S>,
    editor: LcwDocEditor<B, I, S>
): block is BlockFromConfig<FileBlockConfig, I, S> {
    return (block.type in editor.schema.blockSchema && editor.schema.blockSchema[block.type].isFileBlock) || false
}

/**
 * 检查块是否是支持预览的文件块
 * @param block - 要检查的块
 * @param editor - 编辑器实例
 * @returns 类型守卫结果，确认块具有 showPreview 属性
 */
export function checkBlockIsFileBlockWithPreview<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    block: Block<any, I, S>,
    editor: LcwDocEditor<B, I, S>
): block is BlockFromConfig<
    FileBlockConfig & {
        propSchema: Required<FileBlockConfig['propSchema']>
    },
    I,
    S
> {
    return (
        (block.type in editor.schema.blockSchema &&
            editor.schema.blockSchema[block.type].isFileBlock &&
            'showPreview' in editor.schema.blockSchema[block.type].propSchema) ||
        false
    )
}

/**
 * 检查文件块是否有占位符（当没有 URL 时）
 * @param block - 要检查的块
 * @param editor - 编辑器实例
 * @returns 是否为没有 URL 的文件块
 */
export function checkBlockIsFileBlockWithPlaceholder<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    block: Block<B, I, S>,
    editor: LcwDocEditor<B, I, S>
) {
    const config = editor.schema.blockSchema[block.type]
    return config.isFileBlock && !block.props.url
}

/**
 * 检查块的属性模式中是否包含指定的默认属性
 * @param prop - 要检查的属性名
 * @param blockType - 块类型名称
 * @param editor - 编辑器实例
 * @returns 类型守卫结果
 */
export function checkBlockTypeHasDefaultProp<Prop extends keyof typeof defaultProps, I extends InlineContentSchema, S extends StyleSchema>(
    prop: Prop,
    blockType: string,
    editor: LcwDocEditor<any, I, S>
): editor is LcwDocEditor<
    {
        [BT in string]: {
            type: BT
            propSchema: {
                [P in Prop]: (typeof defaultProps)[P]
            }
            content: 'table' | 'inline' | 'none'
        }
    },
    I,
    S
> {
    return (
        blockType in editor.schema.blockSchema &&
        prop in editor.schema.blockSchema[blockType].propSchema &&
        editor.schema.blockSchema[blockType].propSchema[prop] === defaultProps[prop]
    )
}

/**
 * 检查块是否具有指定的默认属性
 * @param prop - 要检查的属性名
 * @param block - 要检查的块
 * @param editor - 编辑器实例
 * @returns 类型守卫结果
 */
export function checkBlockHasDefaultProp<Prop extends keyof typeof defaultProps, I extends InlineContentSchema, S extends StyleSchema>(
    prop: Prop,
    block: Block<any, I, S>,
    editor: LcwDocEditor<any, I, S>
): block is BlockFromConfig<
    {
        type: string
        propSchema: {
            [P in Prop]: (typeof defaultProps)[P]
        }
        content: 'table' | 'inline' | 'none'
    },
    I,
    S
> {
    return checkBlockTypeHasDefaultProp(prop, block.type, editor)
}
