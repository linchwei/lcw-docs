import { describe, test, expect } from 'vitest'
import { en } from '../../src/i18n/locales/en'
import { zh } from '../../src/i18n/locales/zh'
import type { Dictionary } from '../../src/i18n/dictionary'

describe('i18n/dictionary', () => {
    describe('Dictionary 类型', () => {
        test('en 导出对象符合 Dictionary 类型结构', () => {
            const dict: Dictionary = en
            expect(dict).toBeDefined()
            expect(typeof dict).toBe('object')
        })

        test('zh 导出对象符合 Dictionary 类型结构', () => {
            const dict: Dictionary = zh
            expect(dict).toBeDefined()
            expect(typeof dict).toBe('object')
        })
    })

    describe('en 英文翻译字典', () => {
        test('包含 slash_menu 配置', () => {
            expect(en.slash_menu).toBeDefined()
            expect(typeof en.slash_menu).toBe('object')
        })

        test('slash_menu 包含所有必需的块类型', () => {
            const requiredKeys = [
                'heading', 'heading_2', 'heading_3',
                'numbered_list', 'bullet_list', 'check_list',
                'paragraph', 'code_block', 'table',
                'image', 'video', 'audio', 'file', 'emoji',
            ] as const

            for (const key of requiredKeys) {
                expect(en.slash_menu[key]).toBeDefined()
                expect(en.slash_menu[key].title).toBeDefined()
                expect(en.slash_menu[key].subtext).toBeDefined()
                expect(en.slash_menu[key].aliases).toBeDefined()
                expect(en.slash_menu[key].group).toBeDefined()
            }
        })

        test('slash_menu 每个条目的 aliases 是字符串数组', () => {
            for (const key of Object.keys(en.slash_menu)) {
                expect(Array.isArray(en.slash_menu[key as keyof typeof en.slash_menu].aliases)).toBe(true)
            }
        })

        test('包含 placeholders 配置', () => {
            expect(en.placeholders).toBeDefined()
            expect(en.placeholders.default).toBe("Enter text or type '/' for commands")
            expect(en.placeholders.heading).toBe('Heading')
            expect(en.placeholders.bulletListItem).toBe('List')
            expect(en.placeholders.numberedListItem).toBe('List')
            expect(en.placeholders.checkListItem).toBe('List')
        })

        test('包含 file_blocks 配置', () => {
            expect(en.file_blocks).toBeDefined()
            expect(en.file_blocks.image.add_button_text).toBe('Add image')
            expect(en.file_blocks.video.add_button_text).toBe('Add video')
            expect(en.file_blocks.audio.add_button_text).toBe('Add audio')
            expect(en.file_blocks.file.add_button_text).toBe('Add file')
        })

        test('包含 side_menu 配置', () => {
            expect(en.side_menu).toBeDefined()
            expect(en.side_menu.add_block_label).toBe('Add block')
            expect(en.side_menu.drag_handle_label).toBe('Open block menu')
        })

        test('包含 drag_handle 配置', () => {
            expect(en.drag_handle).toBeDefined()
            expect(en.drag_handle.delete_menuitem).toBe('Delete')
            expect(en.drag_handle.colors_menuitem).toBe('Colors')
        })

        test('包含 table_handle 配置', () => {
            expect(en.table_handle).toBeDefined()
            expect(en.table_handle.delete_column_menuitem).toBe('Delete column')
            expect(en.table_handle.delete_row_menuitem).toBe('Delete row')
            expect(en.table_handle.add_left_menuitem).toBe('Add column left')
            expect(en.table_handle.add_right_menuitem).toBe('Add column right')
            expect(en.table_handle.add_above_menuitem).toBe('Add row above')
            expect(en.table_handle.add_below_menuitem).toBe('Add row below')
        })

        test('包含 suggestion_menu 配置', () => {
            expect(en.suggestion_menu).toBeDefined()
            expect(en.suggestion_menu.no_items_title).toBe('No items found')
            expect(en.suggestion_menu.loading).toBe('Loading…')
        })

        test('包含 color_picker 配置', () => {
            expect(en.color_picker).toBeDefined()
            expect(en.color_picker.text_title).toBe('Text')
            expect(en.color_picker.background_title).toBe('Background')
            expect(en.color_picker.colors).toBeDefined()
            expect(en.color_picker.colors.default).toBe('Default')
            expect(en.color_picker.colors.red).toBe('Red')
        })

        test('包含 formatting_toolbar 配置', () => {
            expect(en.formatting_toolbar).toBeDefined()
            expect(en.formatting_toolbar.bold.tooltip).toBe('Bold')
            expect(en.formatting_toolbar.italic.tooltip).toBe('Italic')
            expect(en.formatting_toolbar.underline.tooltip).toBe('Underline')
            expect(en.formatting_toolbar.strike.tooltip).toBe('Strike')
            expect(en.formatting_toolbar.code.tooltip).toBe('Code')
        })

        test('formatting_toolbar 包含文件操作按钮', () => {
            expect(en.formatting_toolbar.file_replace.tooltip).toBeDefined()
            expect(en.formatting_toolbar.file_rename.tooltip).toBeDefined()
            expect(en.formatting_toolbar.file_download.tooltip).toBeDefined()
            expect(en.formatting_toolbar.file_delete.tooltip).toBeDefined()
        })

        test('formatting_toolbar 包含对齐操作', () => {
            expect(en.formatting_toolbar.align_left.tooltip).toBe('Align text left')
            expect(en.formatting_toolbar.align_center.tooltip).toBe('Align text center')
            expect(en.formatting_toolbar.align_right.tooltip).toBe('Align text right')
            expect(en.formatting_toolbar.align_justify.tooltip).toBe('Justify text')
        })

        test('包含 file_panel 配置', () => {
            expect(en.file_panel).toBeDefined()
            expect(en.file_panel.upload.title).toBe('Upload')
            expect(en.file_panel.embed.title).toBe('Embed')
        })

        test('包含 link_toolbar 配置', () => {
            expect(en.link_toolbar).toBeDefined()
            expect(en.link_toolbar.delete.tooltip).toBe('Remove link')
            expect(en.link_toolbar.edit.text).toBe('Edit link')
            expect(en.link_toolbar.open.tooltip).toBe('Open in new tab')
        })

        test('包含 generic 配置', () => {
            expect(en.generic).toBeDefined()
            expect(en.generic.ctrl_shortcut).toBe('Ctrl')
        })
    })

    describe('zh 中文翻译字典', () => {
        test('包含 slash_menu 配置', () => {
            expect(zh.slash_menu).toBeDefined()
            expect(typeof zh.slash_menu).toBe('object')
        })

        test('slash_menu 包含所有必需的块类型', () => {
            const requiredKeys = [
                'heading', 'heading_2', 'heading_3',
                'numbered_list', 'bullet_list', 'check_list',
                'paragraph', 'code_block', 'table',
                'image', 'video', 'audio', 'file', 'emoji',
            ] as const

            for (const key of requiredKeys) {
                expect(zh.slash_menu[key]).toBeDefined()
                expect(zh.slash_menu[key].title).toBeDefined()
                expect(zh.slash_menu[key].subtext).toBeDefined()
                expect(zh.slash_menu[key].aliases).toBeDefined()
                expect(zh.slash_menu[key].group).toBeDefined()
            }
        })

        test('中文翻译值不为空', () => {
            for (const key of Object.keys(zh.slash_menu)) {
                const item = zh.slash_menu[key as keyof typeof zh.slash_menu]
                expect(item.title.length).toBeGreaterThan(0)
                expect(item.subtext.length).toBeGreaterThan(0)
            }
        })

        test('包含 placeholders 配置', () => {
            expect(zh.placeholders).toBeDefined()
            expect(zh.placeholders.default).toBe('输入 \u201c/\u201d 快速插入内容')
            expect(zh.placeholders.heading).toBe('标题')
        })

        test('包含 file_blocks 配置', () => {
            expect(zh.file_blocks).toBeDefined()
            expect(zh.file_blocks.image.add_button_text).toBe('添加图片')
            expect(zh.file_blocks.video.add_button_text).toBe('添加视频')
            expect(zh.file_blocks.audio.add_button_text).toBe('添加音频')
            expect(zh.file_blocks.file.add_button_text).toBe('添加文件')
        })

        test('包含 side_menu 配置', () => {
            expect(zh.side_menu).toBeDefined()
            expect(zh.side_menu.add_block_label).toBe('添加块')
            expect(zh.side_menu.drag_handle_label).toBe('打开菜单')
        })

        test('包含 drag_handle 配置', () => {
            expect(zh.drag_handle).toBeDefined()
            expect(zh.drag_handle.delete_menuitem).toBe('删除')
            expect(zh.drag_handle.colors_menuitem).toBe('颜色')
        })

        test('包含 table_handle 配置', () => {
            expect(zh.table_handle).toBeDefined()
            expect(zh.table_handle.delete_column_menuitem).toBe('删除列')
            expect(zh.table_handle.delete_row_menuitem).toBe('删除行')
        })

        test('包含 formatting_toolbar 配置', () => {
            expect(zh.formatting_toolbar).toBeDefined()
            expect(zh.formatting_toolbar.bold.tooltip).toBe('加粗')
            expect(zh.formatting_toolbar.italic.tooltip).toBe('斜体')
            expect(zh.formatting_toolbar.underline.tooltip).toBe('下划线')
            expect(zh.formatting_toolbar.strike.tooltip).toBe('删除线')
        })

        test('包含 link_toolbar 配置', () => {
            expect(zh.link_toolbar).toBeDefined()
            expect(zh.link_toolbar.delete.tooltip).toBe('清除链接')
            expect(zh.link_toolbar.edit.text).toBe('编辑链接')
        })

        test('包含 generic 配置', () => {
            expect(zh.generic).toBeDefined()
            expect(zh.generic.ctrl_shortcut).toBe('Ctrl')
        })
    })

    describe('en 和 zh 字典结构一致性', () => {
        test('slash_menu 键完全一致', () => {
            const enKeys = Object.keys(en.slash_menu).sort()
            const zhKeys = Object.keys(zh.slash_menu).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('placeholders 键完全一致', () => {
            const enKeys = Object.keys(en.placeholders).sort()
            const zhKeys = Object.keys(zh.placeholders).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('file_blocks 键完全一致', () => {
            const enKeys = Object.keys(en.file_blocks).sort()
            const zhKeys = Object.keys(zh.file_blocks).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('side_menu 键完全一致', () => {
            const enKeys = Object.keys(en.side_menu).sort()
            const zhKeys = Object.keys(zh.side_menu).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('drag_handle 键完全一致', () => {
            const enKeys = Object.keys(en.drag_handle).sort()
            const zhKeys = Object.keys(zh.drag_handle).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('table_handle 键完全一致', () => {
            const enKeys = Object.keys(en.table_handle).sort()
            const zhKeys = Object.keys(zh.table_handle).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('suggestion_menu 键完全一致', () => {
            const enKeys = Object.keys(en.suggestion_menu).sort()
            const zhKeys = Object.keys(zh.suggestion_menu).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('color_picker 键完全一致', () => {
            const enKeys = Object.keys(en.color_picker).sort()
            const zhKeys = Object.keys(zh.color_picker).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('formatting_toolbar 键完全一致', () => {
            const enKeys = Object.keys(en.formatting_toolbar).sort()
            const zhKeys = Object.keys(zh.formatting_toolbar).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('file_panel 键完全一致', () => {
            const enKeys = Object.keys(en.file_panel).sort()
            const zhKeys = Object.keys(zh.file_panel).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('link_toolbar 键完全一致', () => {
            const enKeys = Object.keys(en.link_toolbar).sort()
            const zhKeys = Object.keys(zh.link_toolbar).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('generic 键完全一致', () => {
            const enKeys = Object.keys(en.generic).sort()
            const zhKeys = Object.keys(zh.generic).sort()
            expect(enKeys).toEqual(zhKeys)
        })

        test('每个 slash_menu 条目都有 aliases 数组', () => {
            for (const key of Object.keys(en.slash_menu)) {
                expect(Array.isArray(en.slash_menu[key as keyof typeof en.slash_menu].aliases)).toBe(true)
                expect(Array.isArray(zh.slash_menu[key as keyof typeof zh.slash_menu].aliases)).toBe(true)
            }
        })
    })
})
