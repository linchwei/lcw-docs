import { describe, test, expect, beforeEach, vi } from 'vitest'
import { LcwDocEditor } from '../../src/editor/LcwDocEditor'
import { LcwDocSchema } from '../../src/editor/LcwDocSchema'
import { insertBlocks } from '../../src/api/blockManipulation/commands/insertBlocks/insertBlocks'
import { removeBlocks } from '../../src/api/blockManipulation/commands/removeBlocks/removeBlocks'
import { updateBlock } from '../../src/api/blockManipulation/commands/updateBlock/updateBlock'
import { replaceBlocks } from '../../src/api/blockManipulation/commands/replaceBlocks/replaceBlocks'

vi.mock('../../src/api/blockManipulation/commands/insertBlocks/insertBlocks')
vi.mock('../../src/api/blockManipulation/commands/removeBlocks/removeBlocks')
vi.mock('../../src/api/blockManipulation/commands/updateBlock/updateBlock')
vi.mock('../../src/api/blockManipulation/commands/replaceBlocks/replaceBlocks')

describe('LcwDocEditor', () => {
    describe('create 静态方法', () => {
        test('使用默认选项创建编辑器', () => {
            const editor = LcwDocEditor.create()
            expect(editor).toBeInstanceOf(LcwDocEditor)
            expect(editor.headless).toBe(false)
        })

        test('使用 headless 模式创建编辑器', () => {
            const editor = LcwDocEditor.create({ _headless: true })
            expect(editor).toBeInstanceOf(LcwDocEditor)
            expect(editor.headless).toBe(true)
        })

        test('使用自定义 schema 创建编辑器', () => {
            const schema = LcwDocSchema.create()
            const editor = LcwDocEditor.create({ schema })
            expect(editor).toBeInstanceOf(LcwDocEditor)
            expect(editor.schema).toBe(schema)
        })

        test('使用 initialContent 创建编辑器', () => {
            const initialContent = [
                {
                    type: 'paragraph' as const,
                    id: 'test-block-1',
                },
            ]
            const editor = LcwDocEditor.create({ initialContent: initialContent as any })
            expect(editor).toBeInstanceOf(LcwDocEditor)
            expect(editor.document.length).toBeGreaterThan(0)
        })

        test('使用 placeholders 创建编辑器', () => {
            const placeholders = {
                default: 'Type something...',
                heading: 'Enter heading...',
            }
            const editor = LcwDocEditor.create({ placeholders })
            expect(editor).toBeInstanceOf(LcwDocEditor)
        })

        test('使用 disableExtensions 禁用扩展', () => {
            const editor = LcwDocEditor.create({ disableExtensions: ['link'] })
            expect(editor).toBeInstanceOf(LcwDocEditor)
        })

        test('拒绝废弃的 onEditorContentChange 选项', () => {
            expect(() => {
                LcwDocEditor.create({ onEditorContentChange: vi.fn() } as any)
            }).toThrow('onEditorContentChange initialization option is deprecated')
        })

        test('拒绝废弃的 onTextCursorPositionChange 选项', () => {
            expect(() => {
                LcwDocEditor.create({ onTextCursorPositionChange: vi.fn() } as any)
            }).toThrow('onTextCursorPositionChange initialization option is deprecated')
        })

        test('拒绝废弃的 onEditorReady 选项', () => {
            expect(() => {
                LcwDocEditor.create({ onEditorReady: vi.fn() } as any)
            }).toThrow('onEditorReady is deprecated')
        })

        test('拒绝废弃的 editable 选项', () => {
            expect(() => {
                LcwDocEditor.create({ editable: true } as any)
            }).toThrow('editable initialization option is deprecated')
        })

        test('initialContent 必须是非空数组', () => {
            expect(() => {
                LcwDocEditor.create({ initialContent: [] as any })
            }).toThrow('initialContent must be a non-empty array')
        })

        test('initialContent 不能是字符串', () => {
            expect(() => {
                LcwDocEditor.create({ initialContent: 'not an array' as any })
            }).toThrow('initialContent must be a non-empty array')
        })
    })

    describe('block 操作方法', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            vi.clearAllMocks()
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph' as const,
                        id: 'block-1',
                    },
                    {
                        type: 'paragraph' as const,
                        id: 'block-2',
                    },
                ],
            } as any)
        })

        describe('insertBlocks', () => {
            test('在参考区块前插入区块', () => {
                const newBlocks = [{ type: 'paragraph' as const, id: 'new-block' }]
                editor.insertBlocks(newBlocks as any, 'block-1', 'before')
                expect(insertBlocks).toHaveBeenCalledWith(editor, newBlocks, 'block-1', 'before')
            })

            test('在参考区块后插入区块', () => {
                const newBlocks = [{ type: 'paragraph' as const, id: 'new-block' }]
                editor.insertBlocks(newBlocks as any, 'block-1', 'after')
                expect(insertBlocks).toHaveBeenCalledWith(editor, newBlocks, 'block-1', 'after')
            })

            test('使用 BlockIdentifier 对象插入区块', () => {
                const newBlocks = [{ type: 'paragraph' as const, id: 'new-block' }]
                editor.insertBlocks(newBlocks as any, { id: 'block-1' }, 'before')
                expect(insertBlocks).toHaveBeenCalledWith(editor, newBlocks, { id: 'block-1' }, 'before')
            })
        })

        describe('removeBlocks', () => {
            test('删除单个区块', () => {
                editor.removeBlocks(['block-1'])
                expect(removeBlocks).toHaveBeenCalledWith(editor, ['block-1'])
            })

            test('删除多个区块', () => {
                editor.removeBlocks(['block-1', 'block-2'])
                expect(removeBlocks).toHaveBeenCalledWith(editor, ['block-1', 'block-2'])
            })
        })

        describe('updateBlock', () => {
            test('更新指定区块', () => {
                const update = { props: { backgroundColor: 'red' } }
                editor.updateBlock('block-1', update as any)
                expect(updateBlock).toHaveBeenCalledWith(editor, 'block-1', update)
            })

            test('使用 BlockIdentifier 对象更新区块', () => {
                const update = { props: { backgroundColor: 'blue' } }
                editor.updateBlock({ id: 'block-1' }, update as any)
                expect(updateBlock).toHaveBeenCalledWith(editor, { id: 'block-1' }, update)
            })
        })

        describe('replaceBlocks', () => {
            test('替换区块', () => {
                const blocksToRemove = ['block-1']
                const blocksToInsert = [{ type: 'paragraph' as const, id: 'replacement-block' }]
                editor.replaceBlocks(blocksToRemove, blocksToInsert as any)
                expect(replaceBlocks).toHaveBeenCalledWith(editor, blocksToRemove, blocksToInsert)
            })

            test('替换多个区块', () => {
                const blocksToRemove = ['block-1', 'block-2']
                const blocksToInsert = [{ type: 'paragraph' as const, id: 'new-block' }]
                editor.replaceBlocks(blocksToRemove, blocksToInsert as any)
                expect(replaceBlocks).toHaveBeenCalledWith(editor, blocksToRemove, blocksToInsert)
            })
        })
    })

    describe('样式操作方法', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'block-1',
                    },
                ],
            })
        })

        describe('getActiveStyles', () => {
            test('返回当前激活的样式对象', () => {
                const styles = editor.getActiveStyles()
                expect(styles).toBeDefined()
                expect(typeof styles).toBe('object')
            })

            test('在没有样式时返回空对象', () => {
                const styles = editor.getActiveStyles()
                expect(Object.keys(styles).length).toBe(0)
            })
        })

        describe('addStyles', () => {
            test('添加未知样式时抛出错误', () => {
                expect(() => {
                    editor.addStyles({ unknownStyle: true } as any)
                }).toThrow('style unknownStyle not found in styleSchema')
            })
        })

        describe('removeStyles', () => {
            test('移除未知样式时抛出错误', () => {
                expect(() => {
                    editor.removeStyles({ unknownStyle: true } as any)
                }).toThrow("There is no mark type named 'unknownStyle'")
            })
        })

        describe('toggleStyles', () => {
            test('切换未知样式时抛出错误', () => {
                expect(() => {
                    editor.toggleStyles({ unknownStyle: true } as any)
                }).toThrow('style unknownStyle not found in styleSchema')
            })
        })
    })

    describe('查询方法', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'block-1',
                    },
                    {
                        type: 'paragraph',
                        id: 'block-2',
                    },
                    {
                        type: 'paragraph',
                        id: 'block-3',
                    },
                ],
            })
        })

        describe('getBlock', () => {
            test('通过 ID 获取区块', () => {
                const block = editor.getBlock('block-1')
                expect(block).toBeDefined()
                expect(block?.id).toBe('block-1')
            })

            test('通过 BlockIdentifier 对象获取区块', () => {
                const block = editor.getBlock({ id: 'block-2' })
                expect(block).toBeDefined()
                expect(block?.id).toBe('block-2')
            })

            test('获取不存在的区块返回 undefined', () => {
                const block = editor.getBlock('non-existent')
                expect(block).toBeUndefined()
            })
        })

        describe('forEachBlock', () => {
            test('遍历所有区块', () => {
                const visitedBlocks: string[] = []
                editor.forEachBlock(block => {
                    visitedBlocks.push(block.id)
                    return true
                })
                expect(visitedBlocks).toContain('block-1')
                expect(visitedBlocks).toContain('block-2')
                expect(visitedBlocks).toContain('block-3')
            })

            test('返回 false 可停止遍历', () => {
                const visitedBlocks: string[] = []
                editor.forEachBlock(block => {
                    visitedBlocks.push(block.id)
                    if (block.id === 'block-2') {
                        return false
                    }
                    return true
                })
                expect(visitedBlocks).toContain('block-1')
                expect(visitedBlocks).toContain('block-2')
                expect(visitedBlocks).not.toContain('block-3')
            })

            test('反向遍历区块', () => {
                const visitedBlocks: string[] = []
                editor.forEachBlock(block => {
                    visitedBlocks.push(block.id)
                    return true
                }, true)
                expect(visitedBlocks[0]).toBe('block-3')
            })
        })

        describe('document 属性', () => {
            test('返回文档中的所有区块', () => {
                const blocks = editor.document
                expect(blocks.length).toBe(3)
            })
        })

        describe('topLevelBlocks 属性', () => {
            test('返回顶级区块', () => {
                const blocks = editor.topLevelBlocks
                expect(blocks.length).toBe(3)
            })
        })
    })

    describe('编辑器状态方法', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'block-1',
                    },
                ],
            })
        })

        describe('isEditable getter', () => {
            test('默认可编辑', () => {
                expect(editor.isEditable).toBe(true)
            })

            test('headless 模式下返回 false', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                expect(headlessEditor.isEditable).toBe(false)
            })
        })

        describe('isEditable setter', () => {
            test('设置编辑器为不可编辑', () => {
                editor.isEditable = false
                expect(editor.isEditable).toBe(false)
            })

            test('设置编辑器为可编辑', () => {
                editor.isEditable = false
                editor.isEditable = true
                expect(editor.isEditable).toBe(true)
            })
        })

        describe('isFocused', () => {
            test('headless 编辑器抛出错误', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                expect(() => headlessEditor.isFocused()).toThrow()
            })
        })

        describe('focus', () => {
            test('headless 编辑器抛出错误', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                expect(() => headlessEditor.focus()).toThrow()
            })
        })

        describe('pmSchema', () => {
            test('返回 ProseMirror Schema', () => {
                expect(editor.pmSchema).toBeDefined()
            })
        })

        describe('domElement', () => {
            test('headless 编辑器没有 domElement', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                expect(() => headlessEditor.domElement).toThrow()
            })
        })

        describe('mount', () => {
            test('挂载编辑器到 null 不抛出错误', () => {
                expect(() => editor.mount(null)).not.toThrow()
            })
        })
    })

    describe('协作编辑配置', () => {
        test('更新协作用户信息时需要启用协作模式', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            expect(() => {
                editor.updateCollaborationUserInfo({ name: 'test', color: '#ff0000' })
            }).toThrow('Cannot update collaboration user info when collaboration is disabled')
        })
    })

    describe('deprecated 回调方法', () => {
        test('onEditorContentChange 注册回调', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            const callback = vi.fn()
            expect(() => {
                editor.onEditorContentChange(callback)
            }).not.toThrow()
        })

        test('onEditorSelectionChange 注册回调', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            const callback = vi.fn()
            expect(() => {
                editor.onEditorSelectionChange(callback)
            }).not.toThrow()
        })
    })

    describe('事件回调方法', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
        })

        describe('onChange', () => {
            test('注册内容变化回调', () => {
                const callback = vi.fn()
                const unsubscribe = editor.onChange(callback)
                expect(typeof unsubscribe).toBe('function')
            })

            test('headless 模式下返回 undefined', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                const callback = vi.fn()
                const unsubscribe = headlessEditor.onChange(callback)
                expect(unsubscribe).toBeUndefined()
            })
        })

        describe('onSelectionChange', () => {
            test('注册选区变化回调', () => {
                const callback = vi.fn()
                const unsubscribe = editor.onSelectionChange(callback)
                expect(typeof unsubscribe).toBe('function')
            })

            test('headless 模式下返回 undefined', () => {
                const headlessEditor = LcwDocEditor.create({
                    _headless: true,
                    initialContent: [{ type: 'paragraph', id: 'block-1' }],
                })
                const callback = vi.fn()
                const unsubscribe = headlessEditor.onSelectionChange(callback)
                expect(unsubscribe).toBeUndefined()
            })
        })
    })

    describe('文件上传相关方法', () => {
        test('编辑器具有 uploadFile 方法', () => {
            const uploadFile = vi.fn()
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
                uploadFile,
            })
            expect(typeof editor.uploadFile).toBe('function')
        })

        test('onUploadStart 注册回调', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            const callback = vi.fn()
            const unsubscribe = editor.onUploadStart(callback)
            expect(typeof unsubscribe).toBe('function')
        })

        test('onUploadEnd 注册回调', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            const callback = vi.fn()
            const unsubscribe = editor.onUploadEnd(callback)
            expect(typeof unsubscribe).toBe('function')
        })
    })

    describe('resolveFileUrl', () => {
        test('默认实现返回原始 URL', async () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            const result = await editor.resolveFileUrl('test-url')
            expect(result).toBe('test-url')
        })

        test('使用自定义 resolveFileUrl', async () => {
            const resolveFileUrl = vi.fn((url: string) => Promise.resolve(`resolved-${url}`))
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
                resolveFileUrl,
            })
            const result = await editor.resolveFileUrl('test-url')
            expect(result).toBe('resolved-test-url')
        })
    })

    describe('blockCache', () => {
        test('编辑器具有 blockCache 属性', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            expect(editor.blockCache).toBeDefined()
            expect(editor.blockCache).toBeInstanceOf(WeakMap)
        })
    })

    describe('elementRenderer', () => {
        test('编辑器具有 elementRenderer 属性', () => {
            const editor = LcwDocEditor.create({
                initialContent: [{ type: 'paragraph', id: 'block-1' }],
            })
            expect(editor.elementRenderer).toBeNull()
        })
    })
})