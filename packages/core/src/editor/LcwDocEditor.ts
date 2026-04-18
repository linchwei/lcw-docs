/**
 * LcwDocEditor.ts
 *
 * 核心编辑器主类，负责文档的创建、编辑和管理。
 * 基于 TipTap 编辑器构建，提供区块（Block）级别的编辑功能，
 * 支持富文本样式、内联内容、协作编辑等特性。
 */

// @ts-ignore
import '../style.css'

import { EditorOptions, Extension, getSchema } from '@tiptap/core'
import { Transaction } from '@tiptap/pm/state'
import { Node, Schema } from 'prosemirror-model'
import * as Y from 'yjs'

import { insertBlocks } from '../api/blockManipulation/commands/insertBlocks/insertBlocks'
import { moveBlockDown, moveBlockUp } from '../api/blockManipulation/commands/moveBlock/moveBlock'
import { removeBlocks } from '../api/blockManipulation/commands/removeBlocks/removeBlocks'
import { replaceBlocks } from '../api/blockManipulation/commands/replaceBlocks/replaceBlocks'
import { updateBlock } from '../api/blockManipulation/commands/updateBlock/updateBlock'
import { insertContentAt } from '../api/blockManipulation/insertContentAt'
import { getTextCursorPosition, setTextCursorPosition } from '../api/blockManipulation/selections/textCursorPosition/textCursorPosition'
import { createExternalHTMLExporter } from '../api/exporters/html/externalHTMLExporter'
import { createInternalHTMLSerializer } from '../api/exporters/html/internalHTMLSerializer'
import { blocksToMarkdown } from '../api/exporters/markdown/markdownExporter'
import { getBlockInfoFromSelection } from '../api/getBlockInfoFromPos'
import { inlineContentToNodes } from '../api/nodeConversions/blockToNode'
import { nodeToBlock } from '../api/nodeConversions/nodeToBlock'
import { HTMLToBlocks } from '../api/parsers/html/parseHTML'
import { markdownToBlocks } from '../api/parsers/markdown/parseMarkdown'
import { Block, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, PartialBlock } from '../blocks/defaultBlocks'
import { checkDefaultBlockTypeInSchema } from '../blocks/defaultBlockTypeGuards'
import { FilePanelProsemirrorPlugin } from '../extensions/FilePanel/FilePanelPlugin'
import { FormattingToolbarProsemirrorPlugin } from '../extensions/FormattingToolbar/FormattingToolbarPlugin'
import { LinkToolbarProsemirrorPlugin } from '../extensions/LinkToolbar/LinkToolbarPlugin'
import { NodeSelectionKeyboardPlugin } from '../extensions/NodeSelectionKeyboard/NodeSelectionKeyboardPlugin'
import { PlaceholderPlugin } from '../extensions/Placeholder/PlaceholderPlugin'
import { PreviousBlockTypePlugin } from '../extensions/PreviousBlockType/PreviousBlockTypePlugin'
import { SideMenuProsemirrorPlugin } from '../extensions/SideMenu/SideMenuPlugin'
import { SuggestionMenuProseMirrorPlugin } from '../extensions/SuggestionMenu/SuggestionPlugin'
import { TableHandlesProsemirrorPlugin } from '../extensions/TableHandles/TableHandlesPlugin'
import { UniqueID } from '../extensions/UniqueID/UniqueID'
import { Dictionary } from '../i18n/dictionary'
import { en } from '../i18n/locales/index'
import {
    BlockIdentifier,
    BlockSchema,
    BlockSpecs,
    InlineContentSchema,
    InlineContentSpecs,
    LcwDocDOMAttributes,
    PartialInlineContent,
    Styles,
    StyleSchema,
    StyleSpecs,
} from '../schema/index'
import { mergeCSSClasses } from '../util/browser'
import { NoInfer, UnreachableCaseError } from '../util/typescript'
import { TextCursorPosition } from './cursorPositionTypes'
import { getLcwDocExtensions } from './LcwDocExtensions'
import { LcwDocSchema } from './LcwDocSchema'
import { LcwDocTipTapEditor, LcwDocTipTapEditorOptions } from './LcwDocTipTapEditor'
import { Selection } from './selectionTypes'
import { transformPasted } from './transformPasted'

/**
 * LcwDocEditor 初始化选项
 *
 * @typeParam BSchema - 区块Schema类型
 * @typeParam ISchema - 内联内容Schema类型
 * @typeParam SSchema - 样式Schema类型
 */
export type LcwDocEditorOptions<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> = {
    /**
     * 是否启用动画效果
     */
    animations?: boolean

    /**
     * 需要禁用的扩展名称列表
     */
    disableExtensions: string[]

    /**
     * 国际化词典，用于本地化占位符文本
     */
    dictionary?: Dictionary

    /**
     * 占位符文本映射，键为占位符名称，值为显示文本
     * 支持 'default' 作为默认占位符
     */
    placeholders: Record<string | 'default', string>

    /**
     * DOM属性配置，用于自定义编辑器容器样式
     */
    domAttributes: Partial<LcwDocDOMAttributes>

    /**
     * 编辑器初始内容，区块数组
     */
    initialContent: PartialBlock<NoInfer<BSchema>, NoInfer<ISchema>, NoInfer<SSchema>>[]

    /**
     * 是否加载默认样式
     */
    defaultStyles: boolean

    /**
     * 编辑器Schema配置，定义支持的区块、内联内容和样式
     */
    schema: LcwDocSchema<BSchema, ISchema, SSchema>

    /**
     * 文件上传函数
     * @param file - 要上传的文件
     * @param blockId - 可选的关联区块ID
     * @returns 上传后的文件URL或元数据对象
     */
    uploadFile: (file: File, blockId?: string) => Promise<string | Record<string, any>>

    /**
     * 文件URL解析函数，用于处理相对路径等
     * @param url - 原始文件URL
     * @returns 解析后的完整URL
     */
    resolveFileUrl: (url: string) => Promise<string>

    /**
     * 协作编辑配置
     */
    collaboration: {
        /**
         * Y.js 文档片段，用于同步状态
         */
        fragment: Y.XmlFragment

        /**
         * 当前用户信息
         */
        user: {
            name: string
            color: string
        }

        /**
         * Y.js 协作提供者
         */
        provider: any

        /**
         * 自定义渲染远程用户光标的函数
         * @param user - 远程用户信息
         * @returns 光标DOM元素
         */
        renderCursor?: (user: any) => HTMLElement

        undoManager?: Y.UndoManager
    }

    /**
     * TipTap 编辑器选项，传递给底层编辑器实例
     */
    _tiptapOptions: Partial<EditorOptions>

    /**
     * 是否在末尾添加空的尾部区块
     */
    trailingBlock?: boolean

    /**
     * 是否为无头模式（headless mode）
     * 无头模式下不创建UI组件，适合服务器端渲染
     */
    _headless: boolean

    /**
     * 是否为区块元素设置ID属性
     */
    setIdAttribute?: boolean
}

/**
 * LcwDocEditor 核心编辑器类
 *
 * 提供文档编辑的所有核心功能，包括：
 * - 区块的增删改查
 * - 文本样式设置
 * - 光标位置管理
 * - 富文本内容导入导出
 * - 协作编辑支持
 *
 * @typeParam BSchema - 区块Schema类型，定义支持的区块类型
 * @typeParam ISchema - 内联内容Schema类型，定义支持的内联内容类型
 * @typeParam SSchema - 样式Schema类型，定义支持的样式类型
 */
export class LcwDocEditor<
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
> {
    /**
     * ProseMirror Schema 实例，用于文档结构验证和转换
     */
    private readonly _pmSchema: Schema

    /**
     * 是否为无头模式（无UI）
     */
    public readonly headless: boolean = false

    /**
     * 底层的 TipTap 编辑器实例
     */
    public readonly _tiptapEditor: LcwDocTipTapEditor & { contentComponent: any } = undefined as any

    /**
     * 自定义元素渲染器，用于渲染特定类型的节点
     */
    public elementRenderer: ((node: any, container: HTMLElement) => void) | null = null

    /**
     * 区块缓存，使用 WeakMap 存储节点到区块的映射
     */
    public blockCache = new WeakMap<Node, Block<any, any, any>>()

    /**
     * 国际化词典
     */
    public readonly dictionary: Dictionary

    /**
     * 编辑器Schema配置
     */
    public readonly schema: LcwDocSchema<BSchema, ISchema, SSchema>

    /**
     * 区块类型规格映射
     */
    public readonly blockImplementations: BlockSpecs

    /**
     * 内联内容类型规格映射
     */
    public readonly inlineContentImplementations: InlineContentSpecs

    /**
     * 样式类型规格映射
     */
    public readonly styleImplementations: StyleSpecs

    /**
     * 格式化工具栏插件实例
     */
    public readonly formattingToolbar: FormattingToolbarProsemirrorPlugin

    /**
     * 链接工具栏插件实例
     */
    public readonly linkToolbar: LinkToolbarProsemirrorPlugin<BSchema, ISchema, SSchema>

    /**
     * 侧边菜单插件实例
     */
    public readonly sideMenu: SideMenuProsemirrorPlugin<BSchema, ISchema, SSchema>

    /**
     * 建议菜单插件实例（用于 @ 提及等功能）
     */
    public readonly suggestionMenus: SuggestionMenuProseMirrorPlugin<BSchema, ISchema, SSchema>

    /**
     * 文件面板插件实例（可选）
     */
    public readonly filePanel?: FilePanelProsemirrorPlugin<ISchema, SSchema>

    /**
     * 表格处理插件实例（可选）
     */
    public readonly tableHandles?: TableHandlesProsemirrorPlugin<ISchema, SSchema>

    /**
     * 文件上传函数
     */
    public readonly uploadFile: ((file: File, blockId?: string) => Promise<string | Record<string, any>>) | undefined

    /**
     * 上传开始回调函数列表
     */
    private onUploadStartCallbacks: ((blockId?: string) => void)[] = []

    /**
     * 上传结束回调函数列表
     */
    private onUploadEndCallbacks: ((blockId?: string) => void)[] = []

    /**
     * 文件URL解析函数
     */
    public readonly resolveFileUrl: (url: string) => Promise<string>

    /**
     * 获取 ProseMirror Schema
     */
    public get pmSchema() {
        return this._pmSchema
    }

    /**
     * 创建 LcwDocEditor 实例的静态工厂方法
     *
     * @param options - 编辑器初始化选项
     * @returns 新的 LcwDocEditor 实例
     */
    public static create<
        BSchema extends BlockSchema = DefaultBlockSchema,
        ISchema extends InlineContentSchema = DefaultInlineContentSchema,
        SSchema extends StyleSchema = DefaultStyleSchema,
    >(options: Partial<LcwDocEditorOptions<BSchema, ISchema, SSchema>> = {}) {
        return new LcwDocEditor<BSchema, ISchema, SSchema>(options)
    }

    /**
     * 构造函数
     *
     * @param options - 编辑器初始化选项
     */
    protected constructor(protected readonly options: Partial<LcwDocEditorOptions<any, any, any>>) {
        const anyOpts = options as any

        // 检查并拒绝废弃的初始化选项
        if (anyOpts.onEditorContentChange) {
            throw new Error(
                'onEditorContentChange initialization option is deprecated, use <LcwDocView onChange={...} />, the useEditorChange(...) hook, or editor.onChange(...)'
            )
        }

        if (anyOpts.onTextCursorPositionChange) {
            throw new Error(
                'onTextCursorPositionChange initialization option is deprecated, use <LcwDocView onSelectionChange={...} />, the useEditorSelectionChange(...) hook, or editor.onSelectionChange(...)'
            )
        }

        if (anyOpts.onEditorReady) {
            throw new Error('onEditorReady is deprecated. Editor is immediately ready for use after creation.')
        }

        if (anyOpts.editable) {
            throw new Error(
                'editable initialization option is deprecated, use <LcwDocView editable={true/false} />, or alternatively editor.isEditable = true/false'
            )
        }

        // 初始化词典，使用提供的或默认的英语词典
        this.dictionary = options.dictionary || en

        // 应用默认值并合并选项
        const newOptions = {
            defaultStyles: true,
            schema: options.schema || LcwDocSchema.create(),
            _headless: false,
            ...options,
            placeholders: {
                ...this.dictionary.placeholders,
                ...options.placeholders,
            },
        }

        // @ts-expect-error - we're casting to the correct type here
        this.schema = newOptions.schema
        this.blockImplementations = newOptions.schema.blockSpecs
        this.inlineContentImplementations = newOptions.schema.inlineContentSpecs
        this.styleImplementations = newOptions.schema.styleSpecs

        // 初始化编辑器插件
        this.formattingToolbar = new FormattingToolbarProsemirrorPlugin(this)
        this.linkToolbar = new LinkToolbarProsemirrorPlugin(this)
        this.sideMenu = new SideMenuProsemirrorPlugin(this)
        this.suggestionMenus = new SuggestionMenuProseMirrorPlugin(this)
        this.filePanel = new FilePanelProsemirrorPlugin(this as any)

        // 如果Schema中包含表格类型，则初始化表格处理插件
        if (checkDefaultBlockTypeInSchema('table', this)) {
            this.tableHandles = new TableHandlesProsemirrorPlugin(this as any)
        }

        // 获取所有扩展
        const extensions = getLcwDocExtensions({
            editor: this,
            domAttributes: newOptions.domAttributes || {},
            blockSpecs: this.schema.blockSpecs,
            styleSpecs: this.schema.styleSpecs,
            inlineContentSpecs: this.schema.inlineContentSpecs,
            collaboration: newOptions.collaboration,
            trailingBlock: newOptions.trailingBlock,
            disableExtensions: newOptions.disableExtensions,
            setIdAttribute: newOptions.setIdAttribute,
        })

        // 创建 LcwDoc UI 扩展，整合所有 UI 插件
        const LcwDocUIExtension = Extension.create({
            name: 'LcwDocUIExtension',

            addProseMirrorPlugins: () => {
                return [
                    this.formattingToolbar.plugin,
                    this.linkToolbar.plugin,
                    this.sideMenu.plugin,
                    this.suggestionMenus.plugin,
                    ...(this.filePanel ? [this.filePanel.plugin] : []),
                    ...(this.tableHandles ? [this.tableHandles.plugin] : []),
                    PlaceholderPlugin(this, newOptions.placeholders),
                    NodeSelectionKeyboardPlugin(),
                    ...((this.options.animations ?? true) ? [PreviousBlockTypePlugin()] : []),
                ]
            },
        })
        extensions.push(LcwDocUIExtension)

        // 设置文件上传函数，包装以支持上传回调
        if (newOptions.uploadFile) {
            const uploadFile = newOptions.uploadFile
            this.uploadFile = async (file, block) => {
                this.onUploadStartCallbacks.forEach(callback => callback.apply(this, [block]))
                try {
                    return await uploadFile(file, block)
                } finally {
                    this.onUploadEndCallbacks.forEach(callback => callback.apply(this, [block]))
                }
            }
        }

        // 设置文件URL解析函数
        this.resolveFileUrl = newOptions.resolveFileUrl || (async url => url)
        this.headless = newOptions._headless

        // 协作模式下检查初始内容冲突
        if (newOptions.collaboration && newOptions.initialContent) {
            console.warn(
                'When using Collaboration, initialContent might cause conflicts, because changes should come from the collaboration provider'
            )
        }

        // 构建初始内容
        const initialContent =
            newOptions.initialContent ||
            (options.collaboration
                ? [
                      {
                          type: 'paragraph',
                          id: 'initialBlockId',
                      },
                  ]
                : [
                      {
                          type: 'paragraph',
                          id: UniqueID.options.generateID(),
                      },
                  ])

        // 验证初始内容
        if (!Array.isArray(initialContent) || initialContent.length === 0) {
            throw new Error('initialContent must be a non-empty array of blocks, received: ' + initialContent)
        }

        // 配置 TipTap 编辑器选项
        const tiptapOptions: LcwDocTipTapEditorOptions = {
            ...newOptions._tiptapOptions,
            content: initialContent,
            extensions: [...(newOptions._tiptapOptions?.extensions || []), ...extensions],
            editorProps: {
                ...newOptions._tiptapOptions?.editorProps,
                attributes: {
                    tabIndex: '0',
                    ...newOptions._tiptapOptions?.editorProps?.attributes,
                    ...newOptions.domAttributes?.editor,
                    class: mergeCSSClasses(
                        'bn-editor',
                        newOptions.defaultStyles ? 'bn-default-styles' : '',
                        newOptions.domAttributes?.editor?.class || ''
                    ),
                },
                transformPasted,
            },
        }

        // 根据模式创建编辑器实例
        if (!this.headless) {
            this._tiptapEditor = LcwDocTipTapEditor.create(tiptapOptions, this.schema.styleSchema) as LcwDocTipTapEditor & {
                contentComponent: any
            }
            this._pmSchema = this._tiptapEditor.schema
        } else {
            this._pmSchema = getSchema(tiptapOptions.extensions!)
        }
    }

    /**
     * 分发 ProseMirror 事务
     *
     * @param tr - 要分发的 TipTap 事务
     */
    dispatch(tr: Transaction) {
        this._tiptapEditor.dispatch(tr)
    }

    /**
     * 将编辑器挂载到指定 DOM 元素
     *
     * @param parentElement - 父 DOM 元素，编辑器将挂载到此元素内
     */
    public mount = (parentElement?: HTMLElement | null) => {
        this._tiptapEditor.mount(parentElement)
    }

    /**
     * 获取 ProseMirror EditorView 实例
     */
    public get prosemirrorView() {
        return this._tiptapEditor.view
    }

    /**
     * 获取编辑器 DOM 元素
     */
    public get domElement() {
        return this._tiptapEditor.view.dom as HTMLDivElement
    }

    /**
     * 检查编辑器是否获得焦点
     *
     * @returns 如果编辑器当前拥有焦点则返回 true
     */
    public isFocused() {
        return this._tiptapEditor.view.hasFocus()
    }

    /**
     * 使编辑器获得焦点
     */
    public focus() {
        this._tiptapEditor.view.focus()
    }

    /**
     * 注册文件上传开始时的回调函数
     *
     * @param callback - 上传开始时调用的回调函数
     * @returns 取消订阅的函数，调用后可移除回调
     */
    public onUploadStart(callback: (blockId?: string) => void) {
        this.onUploadStartCallbacks.push(callback)

        return () => {
            const index = this.onUploadStartCallbacks.indexOf(callback)
            if (index > -1) {
                this.onUploadStartCallbacks.splice(index, 1)
            }
        }
    }

    /**
     * 注册文件上传结束时的回调函数
     *
     * @param callback - 上传结束时调用的回调函数
     * @returns 取消订阅的函数，调用后可移除回调
     */
    public onUploadEnd(callback: (blockId?: string) => void) {
        this.onUploadEndCallbacks.push(callback)

        return () => {
            const index = this.onUploadEndCallbacks.indexOf(callback)
            if (index > -1) {
                this.onUploadEndCallbacks.splice(index, 1)
            }
        }
    }

    /**
     * 获取所有顶级区块（不在任何容器内）
     *
     * @returns 顶级区块数组
     */
    public get topLevelBlocks(): Block<BSchema, ISchema, SSchema>[] {
        return this.document
    }

    /**
     * 获取文档中的所有区块
     *
     * @returns 文档内所有区块的数组
     */
    public get document(): Block<BSchema, ISchema, SSchema>[] {
        const blocks: Block<BSchema, ISchema, SSchema>[] = []

        this._tiptapEditor.state.doc.firstChild!.descendants(node => {
            blocks.push(
                nodeToBlock(node, this.schema.blockSchema, this.schema.inlineContentSchema, this.schema.styleSchema, this.blockCache)
            )

            return false
        })

        return blocks
    }

    /**
     * 根据 ID 获取特定区块
     *
     * @param blockIdentifier - 区块标识符（ID字符串或包含id的对象）
     * @returns 找到的区块，如果不存在则返回 undefined
     */
    public getBlock(blockIdentifier: BlockIdentifier): Block<BSchema, ISchema, SSchema> | undefined {
        const id = typeof blockIdentifier === 'string' ? blockIdentifier : blockIdentifier.id
        let newBlock: Block<BSchema, ISchema, SSchema> | undefined = undefined

        this._tiptapEditor.state.doc.firstChild!.descendants(node => {
            if (typeof newBlock !== 'undefined') {
                return false
            }

            if (node.type.name !== 'blockContainer' || node.attrs.id !== id) {
                return true
            }

            newBlock = nodeToBlock(node, this.schema.blockSchema, this.schema.inlineContentSchema, this.schema.styleSchema, this.blockCache)

            return false
        })

        return newBlock
    }

    /**
     * 遍历文档中的所有区块
     *
     * @param callback - 对每个区块调用的回调函数
     *                   返回 false 可停止遍历
     * @param reverse - 是否反向遍历（从后往前）
     */
    public forEachBlock(callback: (block: Block<BSchema, ISchema, SSchema>) => boolean, reverse = false): void {
        const blocks = this.document.slice()

        if (reverse) {
            blocks.reverse()
        }

        function traverseBlockArray(blockArray: Block<BSchema, ISchema, SSchema>[]): boolean {
            for (const block of blockArray) {
                if (callback(block) === false) {
                    return false
                }

                const children = reverse ? block.children.slice().reverse() : block.children

                if (!traverseBlockArray(children)) {
                    return false
                }
            }

            return true
        }

        traverseBlockArray(blocks)
    }

    /**
     * 注册内容变化回调（已废弃，请使用 onChange）
     *
     * @param callback - 内容变化时调用的回调函数
     * @deprecated 请使用 onChange 方法代替
     */
    public onEditorContentChange(callback: () => void) {
        this._tiptapEditor.on('update', callback)
    }

    /**
     * 注册选区变化回调（已废弃，请使用 onSelectionChange）
     *
     * @param callback - 选区变化时调用的回调函数
     * @deprecated 请使用 onSelectionChange 方法代替
     */
    public onEditorSelectionChange(callback: () => void) {
        this._tiptapEditor.on('selectionUpdate', callback)
    }

    /**
     * 获取当前文本光标位置信息
     *
     * @returns 包含当前区块、前一个区块、后一个区块和父区块的光标位置对象
     */
    public getTextCursorPosition(): TextCursorPosition<BSchema, ISchema, SSchema> {
        return getTextCursorPosition(this)
    }

    /**
     * 设置文本光标位置
     *
     * @param targetBlock - 目标区块标识符
     * @param placement - 光标放置位置，'start' 或 'end'
     */
    public setTextCursorPosition(targetBlock: BlockIdentifier, placement: 'start' | 'end' = 'start') {
        setTextCursorPosition(this, targetBlock, placement)
    }

    /**
     * 获取当前选区信息
     *
     * @returns 选区中包含的区块数组，如果没有有效选区则返回 undefined
     */
    public getSelection(): Selection<BSchema, ISchema, SSchema> | undefined {
        if (
            this._tiptapEditor.state.selection.from === this._tiptapEditor.state.selection.to ||
            'node' in this._tiptapEditor.state.selection
        ) {
            return undefined
        }

        const blocks: Block<BSchema, ISchema, SSchema>[] = []

        this._tiptapEditor.state.doc.descendants((node, pos) => {
            if (node.type.spec.group !== 'blockContent') {
                return true
            }

            const end = pos + node.nodeSize - 1
            const start = pos + 1
            if (end <= this._tiptapEditor.state.selection.from || start >= this._tiptapEditor.state.selection.to) {
                return true
            }

            blocks.push(
                nodeToBlock(
                    this._tiptapEditor.state.doc.resolve(pos).node(),
                    this.schema.blockSchema,
                    this.schema.inlineContentSchema,
                    this.schema.styleSchema,
                    this.blockCache
                )
            )

            return false
        })

        return { blocks: blocks }
    }

    /**
     * 检查编辑器是否可编辑
     */
    public get isEditable(): boolean {
        if (!this._tiptapEditor) {
            if (!this.headless) {
                throw new Error('no editor, but also not headless?')
            }
            return false
        }
        return this._tiptapEditor.isEditable === undefined ? true : this._tiptapEditor.isEditable
    }

    /**
     * 设置编辑器是否可编辑
     */
    public set isEditable(editable: boolean) {
        if (!this._tiptapEditor) {
            if (!this.headless) {
                throw new Error('no editor, but also not headless?')
            }
            return
        }
        if (this._tiptapEditor.options.editable !== editable) {
            this._tiptapEditor.setEditable(editable)
        }
    }

    /**
     * 插入区块到文档中
     *
     * @param blocksToInsert - 要插入的区块数组
     * @param referenceBlock - 参考区块，插入位置以此为基准
     * @param placement - 插入位置，'before' 在参考区块前，'after' 在参考区块后
     */
    public insertBlocks(
        blocksToInsert: PartialBlock<BSchema, ISchema, SSchema>[],
        referenceBlock: BlockIdentifier,
        placement: 'before' | 'after' = 'before'
    ) {
        return insertBlocks(this, blocksToInsert, referenceBlock, placement)
    }

    /**
     * 更新指定区块
     *
     * @param blockToUpdate - 要更新的区块标识符
     * @param update - 要应用的更新（部分区块）
     */
    public updateBlock(blockToUpdate: BlockIdentifier, update: PartialBlock<BSchema, ISchema, SSchema>) {
        return updateBlock(this, blockToUpdate, update)
    }

    /**
     * 删除指定区块
     *
     * @param blocksToRemove - 要删除的区块标识符数组
     */
    public removeBlocks(blocksToRemove: BlockIdentifier[]) {
        return removeBlocks(this, blocksToRemove)
    }

    /**
     * 替换区块
     *
     * @param blocksToRemove - 要删除的区块标识符数组
     * @param blocksToInsert - 要插入的新区块数组
     */
    public replaceBlocks(blocksToRemove: BlockIdentifier[], blocksToInsert: PartialBlock<BSchema, ISchema, SSchema>[]) {
        return replaceBlocks(this, blocksToRemove, blocksToInsert)
    }

    /**
     * 在当前选区位置插入内联内容
     *
     * @param content - 要插入的内联内容
     */
    public insertInlineContent(content: PartialInlineContent<ISchema, SSchema>) {
        const nodes = inlineContentToNodes(content, this.pmSchema, this.schema.styleSchema)

        insertContentAt(
            {
                from: this._tiptapEditor.state.selection.from,
                to: this._tiptapEditor.state.selection.to,
            },
            nodes,
            this
        )
    }

    /**
     * 获取当前激活的样式
     *
     * @returns 当前选区激活的样式对象
     */
    public getActiveStyles() {
        const styles: Styles<SSchema> = {}
        const marks = this._tiptapEditor.state.selection.$to.marks()

        for (const mark of marks) {
            const config = this.schema.styleSchema[mark.type.name]
            if (!config) {
                if (mark.type.name !== 'link') {
                    console.warn('mark not found in styleschema', mark.type.name)
                }

                continue
            }
            if (config.propSchema === 'boolean') {
                ;(styles as any)[config.type] = true
            } else {
                ;(styles as any)[config.type] = mark.attrs.stringValue
            }
        }

        return styles
    }

    /**
     * 添加样式到当前选区
     *
     * @param styles - 要添加的样式对象
     */
    public addStyles(styles: Styles<SSchema>) {
        for (const [style, value] of Object.entries(styles)) {
            const config = this.schema.styleSchema[style]
            if (!config) {
                throw new Error(`style ${style} not found in styleSchema`)
            }
            if (config.propSchema === 'boolean') {
                this._tiptapEditor.commands.setMark(style)
            } else if (config.propSchema === 'string') {
                this._tiptapEditor.commands.setMark(style, { stringValue: value })
            } else {
                throw new UnreachableCaseError(config.propSchema)
            }
        }
    }

    /**
     * 从当前选区移除样式
     *
     * @param styles - 要移除的样式对象
     */
    public removeStyles(styles: Styles<SSchema>) {
        for (const style of Object.keys(styles)) {
            this._tiptapEditor.commands.unsetMark(style)
        }
    }

    /**
     * 切换样式（添加则移除，移除则添加）
     *
     * @param styles - 要切换的样式对象
     */
    public toggleStyles(styles: Styles<SSchema>) {
        for (const [style, value] of Object.entries(styles)) {
            const config = this.schema.styleSchema[style]
            if (!config) {
                throw new Error(`style ${style} not found in styleSchema`)
            }
            if (config.propSchema === 'boolean') {
                this._tiptapEditor.commands.toggleMark(style)
            } else if (config.propSchema === 'string') {
                this._tiptapEditor.commands.toggleMark(style, { stringValue: value })
            } else {
                throw new UnreachableCaseError(config.propSchema)
            }
        }
    }

    /**
     * 获取当前选区的文本内容
     *
     * @returns 选区中的纯文本
     */
    public getSelectedText() {
        return this._tiptapEditor.state.doc.textBetween(this._tiptapEditor.state.selection.from, this._tiptapEditor.state.selection.to)
    }

    /**
     * 获取当前选区中链接的 URL
     *
     * @returns 链接 URL，如果选区无链接则返回 undefined
     */
    public getSelectedLinkUrl() {
        return this._tiptapEditor.getAttributes('link').href as string | undefined
    }

    /**
     * 在当前选区创建链接
     *
     * @param url - 链接 URL
     * @param text - 可选的自定义链接文本，默认使用选区文本
     */
    public createLink(url: string, text?: string) {
        if (url === '') {
            return
        }

        const { from, to } = this._tiptapEditor.state.selection

        if (!text) {
            text = this._tiptapEditor.state.doc.textBetween(from, to)
        }

        const mark = this.pmSchema.mark('link', { href: url })

        this.dispatch(this._tiptapEditor.state.tr.insertText(text, from, to).addMark(from, from + text.length, mark))
    }

    /**
     * 检查当前区块是否可以嵌套（变成子区块）
     *
     * @returns 如果可以嵌套则返回 true
     */
    public canNestBlock() {
        const { blockContainer } = getBlockInfoFromSelection(this._tiptapEditor.state)

        return this._tiptapEditor.state.doc.resolve(blockContainer.beforePos).nodeBefore !== null
    }

    /**
     * 将当前区块嵌套为子区块
     */
    public nestBlock() {
        this._tiptapEditor.commands.sinkListItem('blockContainer')
    }

    /**
     * 检查当前区块是否可以取消嵌套（提升层级）
     *
     * @returns 如果可以取消嵌套则返回 true
     */
    public canUnnestBlock() {
        const { blockContainer } = getBlockInfoFromSelection(this._tiptapEditor.state)

        return this._tiptapEditor.state.doc.resolve(blockContainer.beforePos).depth > 1
    }

    /**
     * 将当前区块取消嵌套（提升到父层级）
     */
    public unnestBlock() {
        this._tiptapEditor.commands.liftListItem('blockContainer')
    }

    /**
     * 将当前区块向上移动
     */
    public moveBlockUp() {
        moveBlockUp(this)
    }

    /**
     * 将当前区块向下移动
     */
    public moveBlockDown() {
        moveBlockDown(this)
    }

    /**
     * 将区块转换为 HTML（可能有信息丢失）
     *
     * @param blocks - 要转换的区块数组，默认使用整个文档
     * @returns HTML 字符串
     */
    public async blocksToHTMLLossy(blocks: PartialBlock<BSchema, ISchema, SSchema>[] = this.document): Promise<string> {
        const exporter = createExternalHTMLExporter(this.pmSchema, this)
        return exporter.exportBlocks(blocks, {})
    }

    /**
     * 将区块转换为完整 HTML（保留所有信息）
     *
     * @param blocks - 要转换的区块数组
     * @returns HTML 字符串
     */
    public async blocksToFullHTML(blocks: PartialBlock<BSchema, ISchema, SSchema>[]): Promise<string> {
        const exporter = createInternalHTMLSerializer(this.pmSchema, this)
        return exporter.serializeBlocks(blocks, {})
    }

    /**
     * 尝试将 HTML 解析为区块
     *
     * @param html - HTML 字符串
     * @returns 解析后的区块数组
     */
    public async tryParseHTMLToBlocks(html: string): Promise<Block<BSchema, ISchema, SSchema>[]> {
        return HTMLToBlocks(html, this.schema.blockSchema, this.schema.inlineContentSchema, this.schema.styleSchema, this.pmSchema)
    }

    /**
     * 将区块转换为 Markdown（可能有信息丢失）
     *
     * @param blocks - 要转换的区块数组，默认使用整个文档
     * @returns Markdown 字符串
     */
    public async blocksToMarkdownLossy(blocks: PartialBlock<BSchema, ISchema, SSchema>[] = this.document): Promise<string> {
        return blocksToMarkdown(blocks, this.pmSchema, this, {})
    }

    /**
     * 尝试将 Markdown 解析为区块
     *
     * @param markdown - Markdown 字符串
     * @returns 解析后的区块数组
     */
    public async tryParseMarkdownToBlocks(markdown: string): Promise<Block<BSchema, ISchema, SSchema>[]> {
        return markdownToBlocks(markdown, this.schema.blockSchema, this.schema.inlineContentSchema, this.schema.styleSchema, this.pmSchema)
    }

    /**
     * 更新协作用户信息
     *
     * @param user - 用户信息，包含 name 和 color
     * @throws 如果协作模式未启用则抛出错误
     */
    public updateCollaborationUserInfo(user: { name: string; color: string }) {
        if (!this.options.collaboration) {
            throw new Error('Cannot update collaboration user info when collaboration is disabled.')
        }
        this._tiptapEditor.commands.updateUser(user)
    }

    /**
     * 注册内容变化回调
     *
     * @param callback - 内容变化时调用的回调函数，接收编辑器实例作为参数
     * @returns 取消订阅的函数
     */
    public onChange(callback: (editor: LcwDocEditor<BSchema, ISchema, SSchema>) => void) {
        if (this.headless) {
            return
        }

        const cb = () => {
            callback(this)
        }

        this._tiptapEditor.on('update', cb)

        return () => {
            this._tiptapEditor.off('update', cb)
        }
    }

    /**
     * 注册选区变化回调
     *
     * @param callback - 选区变化时调用的回调函数，接收编辑器实例作为参数
     * @returns 取消订阅的函数
     */
    public onSelectionChange(callback: (editor: LcwDocEditor<BSchema, ISchema, SSchema>) => void) {
        if (this.headless) {
            return
        }

        const cb = () => {
            callback(this)
        }

        this._tiptapEditor.on('selectionUpdate', cb)

        return () => {
            this._tiptapEditor.off('selectionUpdate', cb)
        }
    }

    /**
     * 打开建议菜单（如 @ 提及菜单）
     *
     * @param triggerCharacter - 触发字符（如 '@'）
     * @param pluginState - 可选的插件状态配置
     */
    public openSuggestionMenu(
        triggerCharacter: string,
        pluginState?: {
            deleteTriggerCharacter?: boolean
            ignoreQueryLength?: boolean
        }
    ) {
        const tr = this.prosemirrorView.state.tr
        const transaction = pluginState && pluginState.deleteTriggerCharacter ? tr.insertText(triggerCharacter) : tr

        this.prosemirrorView.focus()
        this.prosemirrorView.dispatch(
            transaction.scrollIntoView().setMeta(this.suggestionMenus.plugin, {
                triggerCharacter: triggerCharacter,
                deleteTriggerCharacter: pluginState?.deleteTriggerCharacter || false,
                ignoreQueryLength: pluginState?.ignoreQueryLength || false,
            })
        )
    }
}
