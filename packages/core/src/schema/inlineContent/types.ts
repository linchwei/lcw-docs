/**
 * 内联内容类型定义模块
 *
 * 此文件定义了编辑器的内联内容(inline content)相关类型，包括内联内容的配置、模式、规范等。
 * 内联内容是块内的文本内容，可以包含样式和链接等。
 */

import { Node } from '@tiptap/core'

import { Props, PropSchema } from '../propTypes'
import { Styles, StyleSchema } from '../styles/types'

/**
 * 自定义内联内容配置
 * 定义内联内容块的类型和内容形式
 */
export type CustomInlineContentConfig = {
    /** 内联内容类型标识 */
    type: string
    /** 内容类型：样式化内容或无内容 */
    content: 'styled' | 'none'
    /** 属性模式定义 */
    readonly propSchema: PropSchema
}

/**
 * 内联内容配置
 * 可能是自定义内联内容、文本或链接
 */
export type InlineContentConfig = CustomInlineContentConfig | 'text' | 'link'

/**
 * 内联内容实现
 * 根据配置类型决定实现方式
 */
export type InlineContentImplementation<T extends InlineContentConfig> = T extends 'link' | 'text'
    ? undefined
    : {
          /** Tiptap节点实例 */
          node: Node
      }

/**
 * 内联内容规范
 * 包含内联内容的配置和实现
 */
export type InlineContentSpec<T extends InlineContentConfig> = {
    /** 内联内容配置 */
    config: T
    /** 内联内容实现 */
    implementation: InlineContentImplementation<T>
}

/**
 * 内联内容模式
 * 记录所有内联内容类型的配置
 */
export type InlineContentSchema = Record<string, InlineContentConfig>

/**
 * 内联内容规范集合
 * 包含内置的text和link以及自定义内联内容
 */
export type InlineContentSpecs = {
    /** 文本类型的规范 */
    text: { config: 'text'; implementation: undefined }
    /** 链接类型的规范 */
    link: { config: 'link'; implementation: undefined }
} & Record<string, InlineContentSpec<InlineContentConfig>>

/**
 * 从内联内容规范集合中提取内联内容模式
 */
export type InlineContentSchemaFromSpecs<T extends InlineContentSpecs> = {
    [K in keyof T]: T[K]['config']
}

/**
 * 从自定义内联内容配置生成的内联内容类型
 */
export type CustomInlineContentFromConfig<I extends CustomInlineContentConfig, S extends StyleSchema> = {
    /** 内联内容类型 */
    type: I['type']
    /** 内联内容属性 */
    props: Props<I['propSchema']>
    /** 内联内容，根据content类型变化 */
    content: I['content'] extends 'styled'
        ? StyledText<S>[]
        : I['content'] extends 'plain'
          ? string
          : I['content'] extends 'none'
            ? undefined
            : never
}

/**
 * 根据内联内容配置生成的内联内容类型
 */
export type InlineContentFromConfig<I extends InlineContentConfig, S extends StyleSchema> = I extends 'text'
    ? StyledText<S>
    : I extends 'link'
      ? Link<S>
      : I extends CustomInlineContentConfig
        ? CustomInlineContentFromConfig<I, S>
        : never

/**
 * 部分自定义内联内容（字段可选）
 */
export type PartialCustomInlineContentFromConfig<I extends CustomInlineContentConfig, S extends StyleSchema> = {
    /** 内联内容类型 */
    type: I['type']
    /** 内联内容属性（可选） */
    props?: Props<I['propSchema']>
    /** 内联内容（可选），根据content类型变化 */
    content?: I['content'] extends 'styled'
        ? StyledText<S>[] | string
        : I['content'] extends 'plain'
          ? string
          : I['content'] extends 'none'
            ? undefined
            : never
}

/**
 * 部分内联内容（字段可选）
 */
export type PartialInlineContentFromConfig<I extends InlineContentConfig, S extends StyleSchema> = I extends 'text'
    ? string | StyledText<S>
    : I extends 'link'
      ? PartialLink<S>
      : I extends CustomInlineContentConfig
        ? PartialCustomInlineContentFromConfig<I, S>
        : never

/**
 * 样式化文本
 * 带有样式的文本片段
 */
export type StyledText<T extends StyleSchema> = {
    /** 内容类型标识 */
    type: 'text'
    /** 文本内容 */
    text: string
    /** 应用的样式 */
    styles: Styles<T>
}

/**
 * 链接
 * 包含超链接和链接文本
 */
export type Link<T extends StyleSchema> = {
    /** 内容类型标识 */
    type: 'link'
    /** 链接地址 */
    href: string
    /** 链接显示的文本内容 */
    content: StyledText<T>[]
}

/**
 * 部分链接（字段可选）
 */
export type PartialLink<T extends StyleSchema> = Omit<Link<T>, 'content'> & {
    content: string | Link<T>['content']
}

/**
 * 内联内容
 * 联合类型，表示任意内联内容
 */
export type InlineContent<I extends InlineContentSchema, T extends StyleSchema> = InlineContentFromConfig<I[keyof I], T>

/**
 * 部分内联内容元素
 */
type PartialInlineContentElement<I extends InlineContentSchema, T extends StyleSchema> = PartialInlineContentFromConfig<I[keyof I], T>

/**
 * 部分内联内容
 * 可以是字符串或部分内联内容数组
 */
export type PartialInlineContent<I extends InlineContentSchema, T extends StyleSchema> = PartialInlineContentElement<I, T>[] | string

/**
 * 判断内联内容是否为链接
 * @param content - 内联内容
 * @returns 是否为链接类型
 */
export function isLinkInlineContent<T extends StyleSchema>(content: InlineContent<any, T>): content is Link<T> {
    return content.type === 'link'
}

/**
 * 判断部分内联内容是否为链接
 * @param content - 部分内联内容元素
 * @returns 是否为部分链接类型
 */
export function isPartialLinkInlineContent<T extends StyleSchema>(content: PartialInlineContentElement<any, T>): content is PartialLink<T> {
    return typeof content !== 'string' && content.type === 'link'
}

/**
 * 判断部分内联内容是否为样式化文本
 * @param content - 部分内联内容元素
 * @returns 是否为样式化文本类型
 */
export function isStyledTextInlineContent<T extends StyleSchema>(content: PartialInlineContentElement<any, T>): content is StyledText<T> {
    return typeof content !== 'string' && content.type === 'text'
}
