/**
 * 样式类型定义模块
 *
 * 此文件定义了编辑器的样式(styles)相关类型，包括样式的配置、模式、规范等。
 * 样式用于内联内容的格式化，如加粗、斜体、颜色等。
 */

import { Mark } from '@tiptap/core'

/**
 * 样式属性模式类型
 * 支持布尔类型（如加粗、斜体）和字符串类型（如颜色代码）
 */
export type StylePropSchema = 'boolean' | 'string'

/**
 * 样式配置
 * 定义样式的基本属性
 */
export type StyleConfig = {
    /** 样式类型标识 */
    type: string
    /** 样式属性模式定义 */
    readonly propSchema: StylePropSchema
}

/**
 * 样式实现
 * 包含Tiptap Mark实例
 */
export type StyleImplementation = {
    /** Tiptap Mark实例 */
    mark: Mark
}

/**
 * 样式规范
 * 包含样式的配置和实现
 */
export type StyleSpec<T extends StyleConfig> = {
    /** 样式配置 */
    config: T
    /** 样式实现 */
    implementation: StyleImplementation
}

/**
 * 样式模式
 * 记录所有样式类型的配置
 */
export type StyleSchema = Record<string, StyleConfig>

/**
 * 样式规范集合
 * 所有注册的样式的规范
 */
export type StyleSpecs = Record<string, StyleSpec<StyleConfig>>

/**
 * 从样式规范集合中提取样式模式
 */
export type StyleSchemaFromSpecs<T extends StyleSpecs> = {
    [K in keyof T]: T[K]['config']
}

/**
 * 样式集合
 * 表示应用到文本的多个样式
 */
export type Styles<T extends StyleSchema> = {
    [K in keyof T]?: T[K]['propSchema'] extends 'boolean' ? boolean : T[K]['propSchema'] extends 'string' ? string : never
}
