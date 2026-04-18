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
        // 传递 content: undefined 给父类，因为我们会在之后手动创建文档
        super({ ...options, content: undefined })

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

        // 创建编辑器状态
        this._state = EditorState.create({
            doc,
            schema: this.schema,
        })
    }

    /**
     * 获取编辑器状态
     *
     * 如果编辑器已挂载（有 view），则从 view 获取最新状态；
     * 否则返回内部维护的状态。
     */
    get state() {
        if (this.view) {
            this._state = this.view.state
        }
        return this._state
    }

    /**
     * 分发事务到编辑器
     *
     * @param tr - 要分发的 TipTap 事务
     */
    dispatch(tr: Transaction) {
        if (this.view) {
            this.view.dispatch(tr)
        } else {
            this._state = this.state.apply(tr)
        }
    }

    /**
     * 创建编辑器视图的替代方法
     *
     * 使用 queueMicrotask 延迟创建视图，以确保所有扩展都已初始化。
     * 该方法创建 EditorView 并配置状态、插件和节点视图。
     */
    private createViewAlternative() {
        queueMicrotask(() => {
            this.view = new EditorView(
                { mount: this.options.element as any },
                {
                    ...this.options.editorProps,

                    // 绑定事务分发方法
                    // @ts-expect-error dispatchTransaction 在 Editor 基类中是私有的，但我们需要绑定它
                    dispatchTransaction: this.dispatchTransaction.bind(this),
                    state: this.state,
                }
            )

            // 重新配置状态以包含扩展管理器创建的插件
            const newState = this.state.reconfigure({
                plugins: this.extensionManager.plugins,
            })

            this.view.updateState(newState)

            // 创建节点视图
            this.createNodeViews()

            // 根据配置决定是否自动聚焦
            this.commands.focus(this.options.autofocus)

            // 触发创建事件
            this.emit('create', { editor: this })
            this.isInitialized = true
        })
    }

    /**
     * 将编辑器挂载到指定元素
     *
     * @param element - 要挂载的 DOM 元素，如果为 null 则销毁编辑器
     */
    public mount = (element?: HTMLElement | null) => {
        if (!element) {
            this.destroy()
        } else {
            this.options.element = element
            this.createViewAlternative()
        }
    }
}

/**
 * 覆盖 TipTap 编辑器的 createView 方法
 *
 * 此覆盖禁用了默认的粘贴和拖拽处理，
 * 因为我们使用自定义的扩展来处理这些功能。
 */
;(LcwDocTipTapEditor.prototype as any).createView = function () {
    this.options.onPaste = this.options.onDrop = undefined
}
