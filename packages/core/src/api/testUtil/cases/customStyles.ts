/**
 * 自定义样式测试用例
 *
 * 该文件定义使用自定义样式的编辑器测试用例。
 * 包含 small（小号文本）和 fontSize（字体大小）两种自定义样式。
 */
import { DefaultBlockSchema, DefaultInlineContentSchema, defaultStyleSpecs } from '../../../blocks/defaultBlocks'
import { uploadToTmpFilesDotOrg_DEV_ONLY } from '../../../blocks/FileBlockContent/uploadToTmpFilesDotOrg_DEV_ONLY'
import { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { LcwDocSchema } from '../../../editor/LcwDocSchema'
import { createStyleSpec } from '../../../schema/styles/createSpec'
import { EditorTestCases } from '../index'

/**
 * 小号文本样式定义
 */
const small = createStyleSpec(
    {
        type: 'small',
        propSchema: 'boolean',
    },
    {
        render: () => {
            const dom = document.createElement('small')
            return {
                dom,
                contentDOM: dom,
            }
        },
    }
)

/**
 * 字体大小样式定义
 */
const fontSize = createStyleSpec(
    {
        type: 'fontSize',
        propSchema: 'string',
    },
    {
        render: value => {
            const dom = document.createElement('span')
            dom.setAttribute('style', 'font-size: ' + value)
            return {
                dom,
                contentDOM: dom,
            }
        },
    }
)

/**
 * 自定义样式 schema
 */
const schema = LcwDocSchema.create({
    styleSpecs: {
        ...defaultStyleSpecs,
        small,
        fontSize,
    },
})

/**
 * 自定义样式测试用例
 *
 * 使用包含自定义样式的 schema 创建编辑器并进行测试。
 */
export const customStylesTestCases: EditorTestCases<DefaultBlockSchema, DefaultInlineContentSchema, typeof schema.styleSchema> = {
    name: 'custom style schema',
    createEditor: () => {
        return LcwDocEditor.create({
            uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
            schema,
        })
    },
    documents: [
        {
            name: 'small/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'This is a small text',
                            styles: {
                                small: true,
                            },
                        },
                    ],
                },
            ],
        },
        {
            name: 'fontSize/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'This is text with a custom fontSize',
                            styles: {
                                fontSize: '18px',
                            },
                        },
                    ],
                },
            ],
        },
    ],
}