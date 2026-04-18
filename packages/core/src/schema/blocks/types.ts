/**
 * 块类型定义模块
 *
 * 此文件定义了编辑器的块(blocks)相关类型，包括块的配置、模式、规范等核心类型定义。
 * 块是编辑器中的主要结构单元，用于构建文档的层级结构。
 */

import type { Extension, Node } from '@tiptap/core'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import type { InlineContent, InlineContentSchema, PartialInlineContent } from '../inlineContent/types'
import type { Props, PropSchema } from '../propTypes'
import type { StyleSchema } from '../styles/types'

/**
 * LCW文档DOM元素类型
 * 表示编辑器中可用的DOM元素种类
 */
export type LcwDocDOMElement = 'editor' | 'block' | 'blockGroup' | 'blockContent' | 'inlineContent'

/**
 * LCW文档DOM属性
 * 为不同DOM元素类型定义自定义属性
 */
export type LcwDocDOMAttributes = Partial<{
    [DOMElement in LcwDocDOMElement]: Record<string, string>
}>

/**
 * 文件块配置
 * 用于配置具有文件上传和预览功能的块
 */
export type FileBlockConfig = {
    /** 块类型标识 */
    type: string
    /** 属性模式定义 */
    readonly propSchema: PropSchema & {
        /** 图片或文件的标题 */
        caption: {
            default: ''
        }
        /** 文件名称 */
        name: {
            default: ''
        }

        /** 文件URL地址 */
        url?: {
            default: ''
        }

        /** 是否显示预览 */
        showPreview?: {
            default: boolean
        }

        /** 预览宽度 */
        previewWidth?: {
            default: number
        }
    }
    /** 内容类型：无可编辑内容 */
    content: 'none'
    /** 是否可选中 */
    isSelectable?: boolean
    /** 标识这是一个文件块 */
    isFileBlock: true
    /** 接受的文件类型列表 */
    fileBlockAccept?: string[]
}

/**
 * 块配置
 * 定义块的通用配置，包括内容类型和属性模式
 */
export type BlockConfig =
    | {
          /** 块类型标识 */
          type: string
          /** 属性模式定义 */
          readonly propSchema: PropSchema
          /** 内容类型：内联内容、无内容或表格 */
          content: 'inline' | 'none' | 'table'
          /** 是否可选中 */
          isSelectable?: boolean
          /** 是否为文件块 */
          isFileBlock?: false
      }
    | FileBlockConfig

/**
 * Tiptap块实现
 * 定义块如何转换为HTML以及其依赖的扩展
 */
export type TiptapBlockImplementation<
    T extends BlockConfig,
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> = {
    /** 依赖的Tiptap扩展和节点 */
    requiredExtensions?: Array<Extension | Node>
    /** Tiptap节点实例 */
    node: Node
    /**
     * 转换为内部HTML
     * @param block - 块数据（不包含子节点）
     * @param editor - 编辑器实例
     * @returns 包含DOM元素和可选内容DOM的对象
     */
    toInternalHTML: (
        block: BlockFromConfigNoChildren<T, I, S> & {
            children: BlockNoDefaults<B, I, S>[]
        },
        editor: LcwDocEditor<B, I, S>
    ) => {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }
    /**
     * 转换为外部HTML（用于复制/粘贴）
     * @param block - 块数据（不包含子节点）
     * @param editor - 编辑器实例
     * @returns 包含DOM元素和可选内容DOM的对象
     */
    toExternalHTML: (
        block: BlockFromConfigNoChildren<T, I, S> & {
            children: BlockNoDefaults<B, I, S>[]
        },
        editor: LcwDocEditor<B, I, S>
    ) => {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }
}

/**
 * 块规范
 * 包含块的配置和实现
 */
export type BlockSpec<T extends BlockConfig, B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    /** 块配置 */
    config: T
    /** 块实现 */
    implementation: TiptapBlockImplementation<T, B, I, S>
}

/**
 * 类型匹配约束
 * 确保块配置中的type字段与键名一致
 */
type NamesMatch<Blocks extends Record<string, BlockConfig>> = Blocks extends {
    [Type in keyof Blocks]: Type extends string ? (Blocks[Type] extends { type: Type } ? Blocks[Type] : never) : never
}
    ? Blocks
    : never

/**
 * 块模式
 * 记录所有块类型的配置
 */
export type BlockSchema = NamesMatch<Record<string, BlockConfig>>

/**
 * 块规范集合
 * 所有注册的块的规范
 */
export type BlockSpecs = Record<string, BlockSpec<any, any, InlineContentSchema, StyleSchema>>

/**
 * 块实现集合
 * 所有注册的块的实现
 */
export type BlockImplementations = Record<string, TiptapBlockImplementation<any, any, any, any>>

/**
 * 从块规范集合中提取块模式
 */
export type BlockSchemaFromSpecs<T extends BlockSpecs> = {
    [K in keyof T]: T[K]['config']
}

/**
 * 特定块类型的模式
 * 创建一个仅包含单一块类型的模式对象
 */
export type BlockSchemaWithBlock<BType extends string, C extends BlockConfig> = {
    [k in BType]: C
}

/**
 * 表格内容
 * 表示表格块的内容结构
 */
export type TableContent<I extends InlineContentSchema, S extends StyleSchema = StyleSchema> = {
    /** 内容类型标识 */
    type: 'tableContent'
    /** 列宽度数组 */
    columnWidths: (number | undefined)[]
    /** 表格行数据 */
    rows: {
        /** 单元格内容 */
        cells: InlineContent<I, S>[][]
    }[]
}

/**
 * 不包含子节点的块数据
 * 根据块配置生成完整的块类型，但不含children属性
 */
export type BlockFromConfigNoChildren<B extends BlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    /** 块唯一标识 */
    id: string
    /** 块类型 */
    type: B['type']
    /** 块属性 */
    props: Props<B['propSchema']>
    /** 块内容，根据content类型变化 */
    content: B['content'] extends 'inline'
        ? InlineContent<I, S>[]
        : B['content'] extends 'table'
          ? TableContent<I, S>
          : B['content'] extends 'none'
            ? undefined
            : never
}

/**
 * 完整的块数据
 * 包含子节点信息的块数据
 */
export type BlockFromConfig<B extends BlockConfig, I extends InlineContentSchema, S extends StyleSchema> = BlockFromConfigNoChildren<
    B,
    I,
    S
> & {
    /** 子节点列表 */
    children: BlockNoDefaults<BlockSchema, I, S>[]
}

/**
 * 不包含子节点的块类型映射
 */
type BlocksWithoutChildren<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    [BType in keyof BSchema]: BlockFromConfigNoChildren<BSchema[BType], I, S>
}

/**
 * 默认块（无默认值）
 * 联合类型，表示任意块类型
 */
export type BlockNoDefaults<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = BlocksWithoutChildren<
    BSchema,
    I,
    S
>[keyof BSchema] & {
    children: BlockNoDefaults<BSchema, I, S>[]
}

/**
 * 特定块类型
 * 精确指定块类型，而非联合类型
 */
export type SpecificBlock<
    BSchema extends BlockSchema,
    BType extends keyof BSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> = BlocksWithoutChildren<BSchema, I, S>[BType] & {
    children: BlockNoDefaults<BSchema, I, S>[]
}

/**
 * 部分表格内容
 * 表格内容中所有字段都是可选的
 */
export type PartialTableContent<I extends InlineContentSchema, S extends StyleSchema = StyleSchema> = {
    /** 内容类型标识 */
    type: 'tableContent'
    /** 列宽度数组（可选） */
    columnWidths?: (number | undefined)[]
    /** 表格行数据 */
    rows: {
        /** 单元格内容（部分内联内容） */
        cells: PartialInlineContent<I, S>[]
    }[]
}

/**
 * 部分块（不包含子节点）
 */
type PartialBlockFromConfigNoChildren<B extends BlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    /** 块ID（可选） */
    id?: string
    /** 块类型（可选） */
    type?: B['type']
    /** 块属性（可选） */
    props?: Partial<Props<B['propSchema']>>
    /** 块内容（可选） */
    content?: B['content'] extends 'inline'
        ? PartialInlineContent<I, S>
        : B['content'] extends 'table'
          ? PartialTableContent<I, S>
          : undefined
}

/**
 * 部分块类型映射
 */
type PartialBlocksWithoutChildren<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    [BType in keyof BSchema]: PartialBlockFromConfigNoChildren<BSchema[BType], I, S>
}

/**
 * 部分默认块
 * 所有字段都可能为可选的块
 */
export type PartialBlockNoDefaults<
    BSchema extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> = PartialBlocksWithoutChildren<BSchema, I, S>[keyof PartialBlocksWithoutChildren<BSchema, I, S>] &
    Partial<{
        children: PartialBlockNoDefaults<BSchema, I, S>[]
    }>

/**
 * 特定部分块
 * 精确指定块类型的部分块
 */
export type SpecificPartialBlock<
    BSchema extends BlockSchema,
    I extends InlineContentSchema,
    BType extends keyof BSchema,
    S extends StyleSchema,
> = PartialBlocksWithoutChildren<BSchema, I, S>[BType] & {
    children?: BlockNoDefaults<BSchema, I, S>[]
}

/**
 * 部分块（完整结构）
 */
export type PartialBlockFromConfig<
    B extends BlockConfig,
    I extends InlineContentSchema,
    S extends StyleSchema,
> = PartialBlockFromConfigNoChildren<B, I, S> & {
    children?: BlockNoDefaults<BlockSchema, I, S>[]
}

/**
 * 块标识符
 * 可以通过ID对象或直接使用ID字符串来标识块
 */
export type BlockIdentifier = { id: string } | string
