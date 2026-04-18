/**
 * LcwDocExtensions.ts
 *
 * 编辑器扩展配置模块，负责整合和配置所有 ProseMirror/TipTap 扩展。
 * 包括基础扩展（如剪贴板、历史记录）、内容类型扩展（区块、内联内容）、
 * 样式扩展（文本颜色、背景色等）以及协作编辑扩展。
 */

import { Extension, Extensions } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { HardBreak } from '@tiptap/extension-hard-break'
import { History } from '@tiptap/extension-history'
import { Link } from '@tiptap/extension-link'
import { Text } from '@tiptap/extension-text'
import * as Y from 'yjs'

import { createDropFileExtension } from '../api/clipboard/fromClipboard/fileDropExtension'
import { createPasteFromClipboardExtension } from '../api/clipboard/fromClipboard/pasteExtension'
import { createCopyToClipboardExtension } from '../api/clipboard/toClipboard/copyExtension'
import { BackgroundColorExtension } from '../extensions/BackgroundColor/BackgroundColorExtension'
import { KeyboardShortcutsExtension } from '../extensions/KeyboardShortcuts/KeyboardShortcutsExtension'
import { TextAlignmentExtension } from '../extensions/TextAlignment/TextAlignmentExtension'
import { TextColorExtension } from '../extensions/TextColor/TextColorExtension'
import { TrailingNode } from '../extensions/TrailingNode/TrailingNodeExtension'
import UniqueID from '../extensions/UniqueID/UniqueID'
import { BlockContainer, BlockGroup, Doc } from '../pm-nodes/index'
import {
    BlockSchema,
    BlockSpecs,
    InlineContentSchema,
    InlineContentSpecs,
    LcwDocDOMAttributes,
    StyleSchema,
    StyleSpecs,
} from '../schema/index'
import type { LcwDocEditor } from './LcwDocEditor'

/**
 * 获取 LcwDoc 编辑器的所有扩展配置
 *
 * @param opts - 扩展配置选项
 * @param opts.editor - LcwDoc 编辑器实例
 * @param opts.domAttributes - DOM 属性配置
 * @param opts.blockSpecs - 区块类型规格
 * @param opts.inlineContentSpecs - 内联内容类型规格
 * @param opts.styleSpecs - 样式类型规格
 * @param opts.trailingBlock - 是否启用尾部区块
 * @param opts.collaboration - 协作编辑配置（可选）
 * @param opts.disableExtensions - 需要禁用的扩展名称列表（可选）
 * @param opts.setIdAttribute - 是否设置 ID 属性
 * @returns TipTap 扩展数组
 */
export const getLcwDocExtensions = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(opts: {
    editor: LcwDocEditor<BSchema, I, S>
    domAttributes: Partial<LcwDocDOMAttributes>
    blockSpecs: BlockSpecs
    inlineContentSpecs: InlineContentSpecs
    styleSpecs: StyleSpecs
    trailingBlock: boolean | undefined
    collaboration?: {
        fragment: Y.XmlFragment
        user: {
            name: string
            color: string
            [key: string]: string
        }
        provider: any
        renderCursor?: (user: any) => HTMLElement
        undoManager?: Y.UndoManager
    }
    disableExtensions: string[] | undefined
    setIdAttribute?: boolean
}) => {
    // 基础扩展列表
    const ret: Extensions = [
        Gapcursor,
        // 唯一 ID 扩展，为 blockContainer 节点生成唯一 ID
        UniqueID.configure({
            types: ['blockContainer'] as const,
            setIdAttribute: opts.setIdAttribute,
        }),
        // 硬换行扩展，优先级设为 10
        HardBreak.extend({ priority: 10 }),
        // 文本节点扩展
        Text,
        // 链接扩展，自定义键盘快捷键 Ctrl/Cmd+K 切换链接
        Link.extend({
            addKeyboardShortcuts() {
                return {
                    'Mod-k': () => {
                        this.editor.commands.toggleLink({ href: '' })
                        return true
                    },
                }
            },
        }),
        // 从样式规格映射创建样式标记扩展
        ...Object.values(opts.styleSpecs).map(styleSpec => {
            return styleSpec.implementation.mark
        }),

        // 文本颜色扩展
        TextColorExtension,

        // 背景颜色扩展
        BackgroundColorExtension,
        // 文本对齐扩展
        TextAlignmentExtension,
        // ESC 键覆盖扩展，用于关闭建议菜单
        Extension.create({
            name: 'OverrideEscape',
            addKeyboardShortcuts() {
                return {
                    Escape: () => {
                        // 如果建议菜单显示中，则不处理 ESC 事件
                        if (opts.editor.suggestionMenus.shown) {
                            return false
                        }
                        return this.editor.commands.blur()
                    },
                }
            },
        }),
        // 文档节点
        Doc,
        // 区块容器节点配置
        BlockContainer.configure({
            editor: opts.editor,
            domAttributes: opts.domAttributes,
        }),
        // 键盘快捷键扩展配置
        KeyboardShortcutsExtension.configure({
            editor: opts.editor,
        }),
        // 区块组节点配置
        BlockGroup.configure({
            domAttributes: opts.domAttributes,
        }),
        // 内联内容节点配置（排除 link 和 text 类型）
        ...Object.values(opts.inlineContentSpecs)
            .filter(a => a.config !== 'link' && a.config !== 'text')
            .map(inlineContentSpec => {
                return inlineContentSpec.implementation!.node.configure({
                    editor: opts.editor as any,
                })
            }),

        // 区块节点配置及其必需的扩展
        ...Object.values(opts.blockSpecs).flatMap(blockSpec => {
            return [
                // 必需扩展
                ...(blockSpec.implementation.requiredExtensions || []).map(ext =>
                    ext.configure({
                        editor: opts.editor,
                        domAttributes: opts.domAttributes,
                    })
                ),
                // 主节点扩展
                blockSpec.implementation.node.configure({
                    editor: opts.editor,
                    domAttributes: opts.domAttributes,
                }),
            ]
        }),
        // 复制到剪贴板扩展
        createCopyToClipboardExtension(opts.editor),
        // 从剪贴板粘贴扩展
        createPasteFromClipboardExtension(opts.editor),
        // 文件拖放扩展
        createDropFileExtension(opts.editor),

        // 拖拽光标样式扩展
        Dropcursor.configure({ width: 5, color: '#ddeeff' }),
        // 尾部节点扩展（在文档末尾添加空段落）
        ...(opts.trailingBlock === undefined || opts.trailingBlock ? [TrailingNode] : []),
    ]

    // 如果配置了协作编辑，则添加协作扩展
    if (opts.collaboration) {
        // 添加 Y.js 协作扩展
        ret.push(
            Collaboration.configure({
                fragment: opts.collaboration.fragment,
                ...(opts.collaboration.undoManager ? { undoManager: opts.collaboration.undoManager } : {}),
            })
        )

        // 如果协作提供者有 awareness（意识）功能，则添加协作光标扩展
        if (opts.collaboration.provider?.awareness) {
            // 默认的光标渲染函数
            const defaultRender = (user: { color: string; name: string }) => {
                // 创建光标插入符元素
                const cursor = document.createElement('span')
                cursor.classList.add('collaboration-cursor__caret')
                cursor.setAttribute('style', `border-color: ${user.color}`)

                // 创建光标标签元素（显示用户名）
                const label = document.createElement('span')
                label.classList.add('collaboration-cursor__label')
                label.setAttribute('style', `background-color: ${user.color}`)
                label.insertBefore(document.createTextNode(user.name), null)

                // 添加不换行空格以保持光标位置
                const nonbreakingSpace1 = document.createTextNode('\u2060')
                const nonbreakingSpace2 = document.createTextNode('\u2060')
                cursor.insertBefore(nonbreakingSpace1, null)
                cursor.insertBefore(label, null)
                cursor.insertBefore(nonbreakingSpace2, null)
                return cursor
            }

            // 添加协作光标扩展
            ret.push(
                CollaborationCursor.configure({
                    user: opts.collaboration.user,
                    render: opts.collaboration.renderCursor || defaultRender,
                    provider: opts.collaboration.provider,
                })
            )
        }
    } else {
        // 非协作模式下，添加历史扩展（支持撤销/重做）
        ret.push(History)
    }

    // 过滤掉需要禁用的扩展
    const disableExtensions: string[] = opts.disableExtensions || []
    return ret.filter(ex => !disableExtensions.includes(ex.name))
}
