/**
 * 默认块定义模块
 * 导出所有内置块的规范定义和类型
 * 包含段落、标题、代码块、列表项、表格、媒体文件等块的定义
 */
import Bold from '@tiptap/extension-bold'
import Code from '@tiptap/extension-code'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'

import { BackgroundColor } from '../extensions/BackgroundColor/BackgroundColorMark'
import { TextColor } from '../extensions/TextColor/TextColorMark'
import {
    BlockNoDefaults,
    BlockSchema,
    BlockSpecs,
    createStyleSpecFromTipTapMark,
    getBlockSchemaFromSpecs,
    getInlineContentSchemaFromSpecs,
    getStyleSchemaFromSpecs,
    InlineContentSchema,
    InlineContentSpecs,
    PartialBlockNoDefaults,
    StyleSchema,
    StyleSpecs,
} from '../schema/index'
import { AudioBlock } from './AudioBlockContent/AudioBlockContent'
import { CodeBlock } from './CodeBlockContent/CodeBlockContent'
import { FileBlock } from './FileBlockContent/FileBlockContent'
import { Heading } from './HeadingBlockContent/HeadingBlockContent'
import { ImageBlock } from './ImageBlockContent/ImageBlockContent'
import { BulletListItem } from './ListItemBlockContent/BulletListItemBlockContent/BulletListItemBlockContent'
import { CheckListItem } from './ListItemBlockContent/CheckListItemBlockContent/CheckListItemBlockContent'
import { NumberedListItem } from './ListItemBlockContent/NumberedListItemBlockContent/NumberedListItemBlockContent'
import { Paragraph } from './ParagraphBlockContent/ParagraphBlockContent'
import { Table } from './TableBlockContent/TableBlockContent'
import { VideoBlock } from './VideoBlockContent/VideoBlockContent'

export { customizeCodeBlock } from './CodeBlockContent/CodeBlockContent'

/**
 * 默认块规范集合
 * 定义编辑器支持的所有内置块的规范
 */
export const defaultBlockSpecs = {
    paragraph: Paragraph,
    heading: Heading,
    codeBlock: CodeBlock,
    bulletListItem: BulletListItem,
    numberedListItem: NumberedListItem,
    checkListItem: CheckListItem,
    table: Table,
    file: FileBlock,
    image: ImageBlock,
    video: VideoBlock,
    audio: AudioBlock,
} satisfies BlockSpecs

/**
 * 从块规范集合生成的默认块 schema
 * 用于编辑器的类型检查和验证
 */
export const defaultBlockSchema = getBlockSchemaFromSpecs(defaultBlockSpecs)

export type _DefaultBlockSchema = typeof defaultBlockSchema
export type DefaultBlockSchema = _DefaultBlockSchema

/**
 * 默认样式规范集合
 * 定义编辑器支持的所有内置样式
 * 包含文本格式（粗体、斜体、下划线、删除线、等宽）和颜色样式
 */
export const defaultStyleSpecs = {
    bold: createStyleSpecFromTipTapMark(Bold, 'boolean'),
    italic: createStyleSpecFromTipTapMark(Italic, 'boolean'),
    underline: createStyleSpecFromTipTapMark(Underline, 'boolean'),
    strike: createStyleSpecFromTipTapMark(Strike, 'boolean'),
    code: createStyleSpecFromTipTapMark(Code, 'boolean'),
    textColor: TextColor,
    backgroundColor: BackgroundColor,
} satisfies StyleSpecs

/**
 * 从样式规范集合生成的默认样式 schema
 */
export const defaultStyleSchema = getStyleSchemaFromSpecs(defaultStyleSpecs)

export type _DefaultStyleSchema = typeof defaultStyleSchema
export type DefaultStyleSchema = _DefaultStyleSchema

/**
 * 默认内联内容规范集合
 * 定义编辑器支持的内联内容类型
 * 目前包含文本和链接两种类型
 */
export const defaultInlineContentSpecs = {
    text: { config: 'text', implementation: {} as any },
    link: { config: 'link', implementation: {} as any },
} satisfies InlineContentSpecs

/**
 * 从内联内容规范集合生成的默认内联内容 schema
 */
export const defaultInlineContentSchema = getInlineContentSchemaFromSpecs(defaultInlineContentSpecs)

export type _DefaultInlineContentSchema = typeof defaultInlineContentSchema
export type DefaultInlineContentSchema = _DefaultInlineContentSchema

/**
 * 允许部分属性的块类型
 * 用于创建新块或更新现有块
 */
export type PartialBlock<
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
> = PartialBlockNoDefaults<BSchema, I, S>

/**
 * 具有完整属性的块类型
 * 用于类型安全的块操作
 */
export type Block<
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
> = BlockNoDefaults<BSchema, I, S>
