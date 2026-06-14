/**
 * LcwDocTipTapEditor.ts
 *
 * TipTap 编辑器封装类，继承自 TipTap 的 Editor 基类。
 * 负责创建和管理底层的 ProseMirror 编辑器实例，
 * 处理初始内容的创建和转换，以及编辑器的挂载。
 */

import { createDocument, EditorOptions } from '@tiptap/core'
import { Editor as TiptapEditor } from '@tiptap/core'
import { Node } from '@tiptap/pm/model'
import { EditorState, Transaction } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

import { blockToNode } from '../api/nodeConversions/blockToNode'
import { PartialBlock } from '../blocks/defaultBlocks'
import { StyleSchema } from '../schema/index'

/**
 * LcwDocTipTapEditor 选项类型
 * 继承自 TipTap EditorOptions，但 content 字段必须提供且为数组类型
 */
export type LcwDocTipTapEditorOptions = Partial<Omit<EditorOptions, 'content'>> & {
    content: PartialBlock<any, any, any>[]
}

/**
 * LcwDocTipTapEditor 编辑器类
 *
 * 封装 TipTap Editor，添加区块内容处理逻辑。
 * 主要功能包括：
 * - 将区块数组转换为 ProseMirror 文档
 * - 处理初始内容的缓存，避免重复创建
 * - 提供编辑器的挂载和分发事务功能
 */
export class LcwDocTipTapEditor extends TiptapEditor {
    /**
     * 编辑器状态
     */
    private _state: EditorState

    /**
     * 创建 LcwDocTipTapEditor 实例的静态工厂方法
     *
     * 使用此方法创建编辑器实例，而非直接使用构造函数。
     * 内部会临时禁用 setTimeout 以避免创建文档时的延迟问题。
     *
     * @param options - 编辑器选项
     * @param styleSchema - 样式 Schema
     * @returns 新的 LcwDocTipTapEditor 实例
     */
    public static create = (options: LcwDocTipTapEditorOptions, styleSchema: StyleSchema) => {
        const oldSetTimeout = globalThis?.window?.setTimeout

        // 临时禁用 setTimeout，避免在创建文档时产生延迟
        if (typeof globalThis?.window?.setTimeout !== 'undefined') {
            globalThis.window.setTimeout = (() => {
                return 0
            }) as any
        }

        try {
            return new LcwDocTipTapEditor(options, styleSchema)
        } finally {
            // 恢复原始的 setTimeout
            if (oldSetTimeout) {
                globalThis.window.setTimeout = oldSetTimeout
            }
        }
    }

    /**
     * 构造函数
     *
     * @param options - 编辑器选项
     * @param styleSchema - 样式 Schema
     */
    protected constructor(options: LcwDocTipTapEditorOptions, styleSchema: StyleSchema) {
        // v3: 传递 content: undefined 和 element: undefined 防止自动挂载和创建默认内容
        super({ ...options, content: undefined, element: undefined })

        const schema = this.schema
        let cache: any

        // 缓存 createAndFill 方法，避免重复创建文档
        // 这是为了处理协作编辑场景下多次创建文档的情况
        const oldCreateAndFill = schema.nodes.doc.createAndFill
        ;(schema.nodes.doc as any).createAndFill = (...args: any) => {
            if (cache) {
                return cache
            }

            const ret = oldCreateAndFill.apply(schema.nodes.doc, args)
            // 将创建的第一个区块的 ID 设置为 'initialBlockId'
            const jsonNode = JSON.parse(JSON.stringify(ret!.toJSON()))
            jsonNode.content[0].content[0].attrs.id = 'initialBlockId'

            cache = Node.fromJSON(schema, jsonNode)
            return cache
        }

        let doc: Node

        try {
            // 将区块数组转换为 ProseMirror 节点
            const pmNodes = options?.content.map(b => blockToNode(b, this.schema, styleSchema).toJSON())

            // 创建 ProseMirror 文档
            doc = createDocument(
                {
                    type: 'doc',
                    content: [
                        {
                            type: 'blockGroup',
                            content: pmNodes,
                        },
                    ],
                },
                this.schema,
                this.options.parseOptions
            )
        } catch (e) {
            console.error('Error creating document from blocks passed as `initialContent`. Caused by exception: ', e)
            throw new Error('Error creating document from blocks passed as `initialContent`:\n' + +JSON.stringify(options.content))
        }

        // 创建编辑器状态（包含扩展插件）
        this._state = EditorState.create({
            doc,
            schema: this.schema,
            plugins: this.extensionManager.plugins,
        })
    }

    /**
     * 获取编辑器状态
     *
     * 如果编辑器已挂载（有 view），则从 view 获取最新状态；
     * 否则返回内部维护的状态。
     */
    get state() {
        // @ts-expect-error v3 中 editorView 为 private 字段，view getter 返回 Proxy（始终 truthy）
        if (this.editorView) {
            // @ts-expect-error v3 中 editorView 为 private 字段
            this._state = this.editorView.state
        }
        return this._state
    }

    /**
     * 分发事务到编辑器
     *
     * @param tr - 要分发的 TipTap 事务
     */
    dispatch(tr: Transaction) {
        // @ts-expect-error v3 中 editorView 为 private 字段，view getter 返回 Proxy（始终 truthy）
        if (this.editorView) {
            // @ts-expect-error v3 中 editorView 为 private 字段
            this.editorView.dispatch(tr)
        } else {
            this._state = this.state.apply(tr)
        }
    }

    /**
     * 创建编辑器视图的替代方法
     *
     * 使用 queueMicrotask 延迟创建视图，以确保所有扩展都已初始化。
     * v3 中 view 为只读 getter，通过设置私有 editorView 字段实现。
     */
    private createViewAlternative() {
        let view: EditorView

        view = new EditorView(
            { mount: this.options.element as any },
            {
                ...this.options.editorProps,
                state: this.state,
                dispatchTransaction: (tr: Transaction) => {
                    const newState = this.state.apply(tr)
                    this._state = newState
                    if (view) {
                        view.updateState(newState)
                    }

                    this.emit('transaction', { editor: this, transaction: tr, appendedTransactions: [] })
                    if (tr.docChanged) {
                        this.emit('update', { editor: this, transaction: tr, appendedTransactions: [] })
                    }
                    if (tr.selectionSet) {
                        this.emit('selectionUpdate', { editor: this, transaction: tr })
                    }
                },
            }
        )

        // v3: view 是只读 getter，通过设置私有 editorView 字段绕过
        // @ts-expect-error v3 中 editorView 为 private 字段
        this.editorView = view

        // 重新配置状态以包含扩展管理器创建的插件
        const newState = this.state.reconfigure({
            plugins: this.extensionManager.plugins,
        })

        view.updateState(newState)

        // createNodeViews 由 EditorContent 在设置 contentComponent 后调用

        // 根据配置决定是否自动聚焦
        this.commands.focus(this.options.autofocus)

        // 触发创建事件
        this.emit('create', { editor: this })
        this.isInitialized = true
    }

    /**
     * 将编辑器挂载到指定元素
     *
     * @param element - 要挂载的 DOM 元素
     */
    public mount = (element: NonNullable<EditorOptions['element']> & {}) => {
        this.options.element = element
        this.createViewAlternative()
    }
}
