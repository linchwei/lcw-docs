/**
 * 默认 Schema 测试用例
 *
 * 该文件定义使用默认 schema 的编辑器测试用例。
 * 包含各种块类型的测试文档，如段落、列表、代码块、文件、图片、表格、链接等。
 */
import { DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema } from '../../../blocks/defaultBlocks'
import { uploadToTmpFilesDotOrg_DEV_ONLY } from '../../../blocks/FileBlockContent/uploadToTmpFilesDotOrg_DEV_ONLY'
import { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { EditorTestCases } from '../index'

/**
 * 默认 Schema 测试用例
 *
 * 使用默认配置的编辑器创建函数和多种测试文档。
 */
export const defaultSchemaTestCases: EditorTestCases<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema> = {
    name: 'default schema',
    createEditor: () => {
        return LcwDocEditor.create({
            uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
        })
    },
    documents: [
        {
            name: 'paragraph/empty',
            blocks: [
                {
                    type: 'paragraph',
                },
            ],
        },
        {
            name: 'paragraph/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: 'Paragraph',
                },
            ],
        },
        {
            name: 'paragraph/styled',
            blocks: [
                {
                    type: 'paragraph',
                    props: {
                        textAlignment: 'center',
                        textColor: 'orange',
                        backgroundColor: 'pink',
                    },
                    content: [
                        {
                            type: 'text',
                            styles: {},
                            text: 'Plain ',
                        },
                        {
                            type: 'text',
                            styles: {
                                textColor: 'red',
                            },
                            text: 'Red Text ',
                        },
                        {
                            type: 'text',
                            styles: {
                                backgroundColor: 'blue',
                            },
                            text: 'Blue Background ',
                        },
                        {
                            type: 'text',
                            styles: {
                                textColor: 'red',
                                backgroundColor: 'blue',
                            },
                            text: 'Mixed Colors',
                        },
                    ],
                },
            ],
        },
        {
            name: 'paragraph/nested',
            blocks: [
                {
                    type: 'paragraph',
                    content: 'Paragraph',
                    children: [
                        {
                            type: 'paragraph',
                            content: 'Nested Paragraph 1',
                        },
                        {
                            type: 'paragraph',
                            content: 'Nested Paragraph 2',
                        },
                    ],
                },
            ],
        },
        {
            name: 'paragraph/lineBreaks',
            blocks: [
                {
                    type: 'paragraph',
                    content: 'Line 1\nLine 2',
                },
            ],
        },
        {
            name: 'lists/basic',
            blocks: [
                {
                    type: 'bulletListItem',
                    content: 'Bullet List Item 1',
                },
                {
                    type: 'bulletListItem',
                    content: 'Bullet List Item 2',
                },
                {
                    type: 'numberedListItem',
                    content: 'Numbered List Item 1',
                },
                {
                    type: 'numberedListItem',
                    content: 'Numbered List Item 2',
                },
                {
                    type: 'checkListItem',
                    content: 'Check List Item 1',
                },
                {
                    type: 'checkListItem',
                    props: {
                        checked: true,
                    },
                    content: 'Check List Item 2',
                },
            ],
        },
        {
            name: 'lists/nested',
            blocks: [
                {
                    type: 'bulletListItem',
                    content: 'Bullet List Item 1',
                },
                {
                    type: 'bulletListItem',
                    content: 'Bullet List Item 2',
                    children: [
                        {
                            type: 'numberedListItem',
                            content: 'Numbered List Item 1',
                        },
                        {
                            type: 'numberedListItem',
                            content: 'Numbered List Item 2',
                            children: [
                                {
                                    type: 'checkListItem',
                                    content: 'Check List Item 1',
                                },
                                {
                                    type: 'checkListItem',
                                    props: {
                                        checked: true,
                                    },
                                    content: 'Check List Item 2',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            name: 'codeBlock/empty',
            blocks: [
                {
                    type: 'codeBlock',
                },
            ],
        },
        {
            name: 'codeBlock/defaultLanguage',
            blocks: [
                {
                    type: 'codeBlock',
                    content: "console.log('Hello, world!');",
                },
            ],
        },
        {
            name: 'codeBlock/python',
            blocks: [
                {
                    type: 'codeBlock',
                    props: { language: 'python' },
                    content: "print('Hello, world!')",
                },
            ],
        },
        {
            name: 'file/button',
            blocks: [
                {
                    type: 'file',
                },
            ],
        },
        {
            name: 'file/basic',
            blocks: [
                {
                    type: 'file',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        caption: 'Caption',
                    },
                },
            ],
        },
        {
            name: 'file/noName',
            blocks: [
                {
                    type: 'file',
                    props: {
                        url: 'exampleURL',
                        caption: 'Caption',
                    },
                },
            ],
        },
        {
            name: 'file/noCaption',
            blocks: [
                {
                    type: 'file',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                    },
                },
            ],
        },
        {
            name: 'file/nested',
            blocks: [
                {
                    type: 'file',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        caption: 'Caption',
                    },
                    children: [
                        {
                            type: 'file',
                            props: {
                                name: 'example',
                                url: 'exampleURL',
                                caption: 'Caption',
                            },
                        },
                    ],
                },
            ],
        },
        {
            name: 'image/button',
            blocks: [
                {
                    type: 'image',
                },
            ],
        },
        {
            name: 'image/basic',
            blocks: [
                {
                    type: 'image',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        caption: 'Caption',
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'image/noName',
            blocks: [
                {
                    type: 'image',
                    props: {
                        url: 'exampleURL',
                        caption: 'Caption',
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'image/noCaption',
            blocks: [
                {
                    type: 'image',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'image/noPreview',
            blocks: [
                {
                    type: 'image',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        caption: 'Caption',
                        showPreview: false,
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'image/nested',
            blocks: [
                {
                    type: 'image',
                    props: {
                        url: 'exampleURL',
                        caption: 'Caption',
                        previewWidth: 256,
                    },
                    children: [
                        {
                            type: 'image',
                            props: {
                                url: 'exampleURL',
                                caption: 'Caption',
                                previewWidth: 256,
                            },
                        },
                    ],
                },
            ],
        },
        {
            name: 'table/basic',
            blocks: [
                {
                    type: 'table',
                    content: {
                        type: 'tableContent',
                        rows: [
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                        ],
                    },
                },
            ],
        },
        {
            name: 'table/allColWidths',
            blocks: [
                {
                    type: 'table',
                    content: {
                        type: 'tableContent',
                        columnWidths: [100, 200, 300],
                        rows: [
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                        ],
                    },
                },
            ],
        },
        {
            name: 'table/mixedColWidths',
            blocks: [
                {
                    type: 'table',
                    content: {
                        type: 'tableContent',
                        columnWidths: [100, undefined, 300],
                        rows: [
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                            {
                                cells: ['Table Cell', 'Table Cell', 'Table Cell'],
                            },
                        ],
                    },
                },
            ],
        },
        {
            name: 'link/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'link',
                            href: 'https://www.website.com',
                            content: 'Website',
                        },
                    ],
                },
            ],
        },
        {
            name: 'link/styled',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'link',
                            href: 'https://www.website.com',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Web',
                                    styles: {
                                        bold: true,
                                    },
                                },
                                {
                                    type: 'text',
                                    text: 'site',
                                    styles: {},
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            name: 'link/adjacent',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'link',
                            href: 'https://www.website.com',
                            content: 'Website',
                        },
                        {
                            type: 'link',
                            href: 'https://www.website2.com',
                            content: 'Website2',
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Text1\nText2',
                            styles: {},
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/multiple',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Text1\nText2\nText3',
                            styles: {},
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/start',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: '\nText1',
                            styles: {},
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/end',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Text1\n',
                            styles: {},
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/only',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: '\n',
                            styles: {},
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/styles',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Text1\n',
                            styles: {},
                        },
                        {
                            type: 'text',
                            text: 'Text2',
                            styles: { bold: true },
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/link',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'link',
                            href: 'https://www.website.com',
                            content: 'Link1\nLink1',
                        },
                    ],
                },
            ],
        },
        {
            name: 'hardbreak/between-links',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'link',
                            href: 'https://www.website.com',
                            content: 'Link1\n',
                        },
                        {
                            type: 'link',
                            href: 'https://www.website2.com',
                            content: 'Link2',
                        },
                    ],
                },
            ],
        },
        {
            name: 'complex/misc',
            blocks: [
                {
                    type: 'heading',
                    props: {
                        backgroundColor: 'blue',
                        textColor: 'yellow',
                        textAlignment: 'right',
                        level: 2,
                    },
                    content: [
                        {
                            type: 'text',
                            text: 'Heading ',
                            styles: {
                                bold: true,
                                underline: true,
                            },
                        },
                        {
                            type: 'text',
                            text: '2',
                            styles: {
                                italic: true,
                                strike: true,
                            },
                        },
                    ],
                    children: [
                        {
                            type: 'paragraph',
                            props: {
                                backgroundColor: 'red',
                            },
                            content: 'Paragraph',
                            children: [],
                        },
                        {
                            type: 'bulletListItem',
                            props: {},
                        },
                    ],
                },
            ],
        },
    ],
}