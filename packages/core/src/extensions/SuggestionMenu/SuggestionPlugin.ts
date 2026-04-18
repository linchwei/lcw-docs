/**
 * 建议菜单插件
 *
 * 该插件实现输入时显示建议菜单的功能（如斜杠命令菜单、表情选择器等）。
 * 用户输入特定触发字符后，会显示一个上下文菜单供选择。
 */

import { findParentNode } from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { EventEmitter } from '../../util/EventEmitter'

/**
 * 查找包含块容器的父节点
 */
const findBlock = findParentNode(node => node.type.name === 'blockContainer')

/**
 * 建议菜单状态
 *
 * 描述建议菜单的显示状态、位置和当前查询内容
 */
export type SuggestionMenuState = UiElementPosition & {
    query: string
    ignoreQueryLength?: boolean
}

/**
 * 建议菜单视图类
 *
 * 负责管理建议菜单的显示状态和用户交互
 */
class SuggestionMenuView<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> {
    public state?: SuggestionMenuState
    public emitUpdate: (triggerCharacter: string) => void
    private rootEl?: Document | ShadowRoot
    pluginState: SuggestionPluginState

    constructor(
        private readonly editor: LcwDocEditor<BSchema, I, S>,
        emitUpdate: (menuName: string, state: SuggestionMenuState) => void
    ) {
        this.pluginState = undefined

        this.emitUpdate = (menuName: string) => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized suggestions menu')
            }

            emitUpdate(menuName, {
                ...this.state,
                ignoreQueryLength: this.pluginState?.ignoreQueryLength,
            })
        }

        this.rootEl = this.editor._tiptapEditor.view.root

        this.rootEl?.addEventListener('scroll', this.handleScroll, true)
    }

    /**
     * 处理滚动事件
     *
     * 当用户滚动时，更新装饰器节点的位置信息
     */
    handleScroll = () => {
        if (this.state?.show) {
            const decorationNode = this.rootEl?.querySelector(`[data-decoration-id="${this.pluginState!.decorationId}"]`)
            if (!decorationNode) {
                return
            }
            this.state.referencePos = decorationNode.getBoundingClientRect()
            this.emitUpdate(this.pluginState!.triggerCharacter!)
        }
    }

    /**
     * 更新视图状态
     *
     * 同步插件状态和视图状态，
     * 处理菜单的显示、隐藏和内容更新
     */
    update(view: EditorView, prevState: EditorState) {
        const prev: SuggestionPluginState = suggestionMenuPluginKey.getState(prevState)
        const next: SuggestionPluginState = suggestionMenuPluginKey.getState(view.state)
        const started = prev === undefined && next !== undefined
        const stopped = prev !== undefined && next === undefined
        const changed = prev !== undefined && next !== undefined

        if (!started && !changed && !stopped) {
            return
        }

        this.pluginState = stopped ? prev : next

        if (stopped || !this.editor.isEditable) {
            this.state!.show = false
            this.emitUpdate(this.pluginState!.triggerCharacter)

            return
        }

        const decorationNode = this.rootEl?.querySelector(`[data-decoration-id="${this.pluginState!.decorationId}"]`)

        if (this.editor.isEditable && decorationNode) {
            this.state = {
                show: true,
                referencePos: decorationNode.getBoundingClientRect(),
                query: this.pluginState!.query,
            }

            this.emitUpdate(this.pluginState!.triggerCharacter!)
        }
    }

    /**
     * 销毁视图
     *
     * 移除事件监听器
     */
    destroy() {
        this.rootEl?.removeEventListener('scroll', this.handleScroll, true)
    }

    /**
     * 关闭菜单
     *
     * 通过发送meta信息来关闭菜单
     */
    closeMenu = () => {
        this.editor.dispatch(this.editor._tiptapEditor.view.state.tr.setMeta(suggestionMenuPluginKey, null))
    }

    /**
     * 清除查询内容
     *
     * 删除从触发字符到当前光标位置的内容
     */
    clearQuery = () => {
        if (this.pluginState === undefined) {
            return
        }

        this.editor._tiptapEditor
            .chain()
            .focus()
            .deleteRange({
                from:
                    this.pluginState.queryStartPos! -
                    (this.pluginState.deleteTriggerCharacter ? this.pluginState.triggerCharacter!.length : 0),
                to: this.editor._tiptapEditor.state.selection.from,
            })
            .run()
    }
}

/**
 * 建议插件状态
 *
 * 描述当前建议菜单的完整状态信息
 */
type SuggestionPluginState =
    | {
          triggerCharacter: string
          deleteTriggerCharacter: boolean
          queryStartPos: number
          query: string
          decorationId: string
          ignoreQueryLength?: boolean
      }
    | undefined

const suggestionMenuPluginKey = new PluginKey('SuggestionMenuPlugin')

/**
 * 建议菜单ProseMirror插件
 *
 * 该插件负责：
 * - 检测触发字符的输入
 * - 跟踪查询内容和位置
 * - 管理菜单的显示和隐藏
 * - 提供装饰器来高亮触发区域
 */
export class SuggestionMenuProseMirrorPlugin<
    BSchema extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> extends EventEmitter<any> {
    private view: SuggestionMenuView<BSchema, I, S> | undefined
    public readonly plugin: Plugin

    private triggerCharacters: string[] = []

    constructor(editor: LcwDocEditor<BSchema, I, S>) {
        super()
        const triggerCharacters = this.triggerCharacters
        this.plugin = new Plugin({
            key: suggestionMenuPluginKey,

            view: () => {
                this.view = new SuggestionMenuView<BSchema, I, S>(editor, (triggerCharacter, state) => {
                    this.emit(`update ${triggerCharacter}`, state)
                })
                return this.view
            },

            state: {
                /**
                 * 初始化插件状态
                 */
                init(): SuggestionPluginState {
                    return undefined
                },

                /**
                 * 应用事务时更新插件状态
                 *
                 * 处理逻辑：
                 * 1. 如果有特定meta信息，开始建议菜单
                 * 2. 如果光标位置变化离开触发区域，关闭菜单
                 * 3. 更新查询内容
                 */
                apply(transaction, prev, _oldState, newState): SuggestionPluginState {
                    if (transaction.getMeta('orderedListIndexing') !== undefined) {
                        return prev
                    }

                    if (transaction.selection.$from.parent.type.spec.code) {
                        return prev
                    }

                    const suggestionPluginTransactionMeta: {
                        triggerCharacter: string
                        deleteTriggerCharacter?: boolean
                        ignoreQueryLength?: boolean
                    } | null = transaction.getMeta(suggestionMenuPluginKey)

                    if (
                        typeof suggestionPluginTransactionMeta === 'object' &&
                        suggestionPluginTransactionMeta !== null &&
                        prev === undefined
                    ) {
                        return {
                            triggerCharacter: suggestionPluginTransactionMeta.triggerCharacter,
                            deleteTriggerCharacter: suggestionPluginTransactionMeta.deleteTriggerCharacter !== false,
                            queryStartPos: newState.selection.from,
                            query: '',
                            decorationId: `id_${Math.floor(Math.random() * 0xffffffff)}`,
                            ignoreQueryLength: suggestionPluginTransactionMeta?.ignoreQueryLength,
                        }
                    }

                    if (prev === undefined) {
                        return prev
                    }

                    if (
                        newState.selection.from !== newState.selection.to ||
                        suggestionPluginTransactionMeta === null ||
                        transaction.getMeta('focus') ||
                        transaction.getMeta('blur') ||
                        transaction.getMeta('pointer') ||
                        (prev.triggerCharacter !== undefined && newState.selection.from < prev.queryStartPos!)
                    ) {
                        return undefined
                    }

                    const next = { ...prev }

                    next.query = newState.doc.textBetween(prev.queryStartPos!, newState.selection.from)

                    return next
                },
            },

            props: {
                /**
                 * 处理文本输入事件
                 *
                 * 当输入触发字符时，开启建议菜单
                 */
                handleTextInput(view, _from, _to, text) {
                    const suggestionPluginState: SuggestionPluginState = (this as Plugin).getState(view.state)

                    if (triggerCharacters.includes(text) && suggestionPluginState === undefined) {
                        view.dispatch(
                            view.state.tr.insertText(text).scrollIntoView().setMeta(suggestionMenuPluginKey, {
                                triggerCharacter: text,
                            })
                        )

                        return true
                    }
                    return false
                },

                /**
                 * 提供装饰器
                 *
                 * 在触发字符区域添加高亮装饰器
                 */
                decorations(state) {
                    const suggestionPluginState: SuggestionPluginState = (this as Plugin).getState(state)

                    if (suggestionPluginState === undefined) {
                        return null
                    }

                    if (!suggestionPluginState.deleteTriggerCharacter) {
                        const blockNode = findBlock(state.selection)
                        if (blockNode) {
                            return DecorationSet.create(state.doc, [
                                Decoration.node(blockNode.pos, blockNode.pos + blockNode.node.nodeSize, {
                                    nodeName: 'span',
                                    class: 'bn-suggestion-decorator',
                                    'data-decoration-id': suggestionPluginState.decorationId,
                                }),
                            ])
                        }
                    }

                    return DecorationSet.create(state.doc, [
                        Decoration.inline(
                            suggestionPluginState.queryStartPos! - suggestionPluginState.triggerCharacter!.length,
                            suggestionPluginState.queryStartPos!,
                            {
                                nodeName: 'span',
                                class: 'bn-suggestion-decorator',
                                'data-decoration-id': suggestionPluginState.decorationId,
                            }
                        ),
                    ])
                },
            },
        })
    }

    /**
     * 订阅指定触发字符的更新事件
     *
     * @param triggerCharacter - 触发字符
     * @param callback - 状态更新回调
     * @returns 取消订阅函数
     */
    public onUpdate(triggerCharacter: string, callback: (state: SuggestionMenuState) => void) {
        if (!this.triggerCharacters.includes(triggerCharacter)) {
            this.addTriggerCharacter(triggerCharacter)
        }

        return this.on(`update ${triggerCharacter}`, callback)
    }

    /**
     * 添加触发字符
     *
     * @param triggerCharacter - 要添加的触发字符
     */
    addTriggerCharacter = (triggerCharacter: string) => {
        this.triggerCharacters.push(triggerCharacter)
    }

    /**
     * 移除触发字符
     *
     * @param triggerCharacter - 要移除的触发字符
     */
    removeTriggerCharacter = (triggerCharacter: string) => {
        this.triggerCharacters = this.triggerCharacters.filter(c => c !== triggerCharacter)
    }

    /**
     * 关闭菜单
     */
    closeMenu = () => this.view!.closeMenu()

    /**
     * 清除查询
     */
    clearQuery = () => this.view!.clearQuery()

    /**
     * 获取菜单是否显示
     */
    public get shown() {
        return this.view?.state?.show || false
    }
}

/**
 * 创建建议菜单
 *
 * 为编辑器添加指定触发字符的建议菜单功能
 *
 * @param editor - 编辑器实例
 * @param triggerCharacter - 触发字符（如 "/" 用于斜杠命令）
 */
export function createSuggestionMenu<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    triggerCharacter: string
) {
    editor.suggestionMenus.addTriggerCharacter(triggerCharacter)
}
