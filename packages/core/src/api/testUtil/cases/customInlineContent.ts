/**
 * 自定义内联内容测试用例
 *
 * 该文件定义使用自定义内联内容的编辑器测试用例。
 * 包含 mention（提及）和 tag（标签）两种自定义内联内容类型。
 */
import { DefaultBlockSchema, defaultInlineContentSpecs, DefaultStyleSchema } from '../../../blocks/defaultBlocks'
import { uploadToTmpFilesDotOrg_DEV_ONLY } from '../../../blocks/FileBlockContent/uploadToTmpFilesDotOrg_DEV_ONLY'
import { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { LcwDocSchema } from '../../../editor/LcwDocSchema'
import { createInlineContentSpec } from '../../../schema/inlineContent/createSpec'
import { EditorTestCases } from '../index'

/**
 * 提及内联内容定义
 */
const mention = createInlineContentSpec(
    {
        type: 'mention' as const,
        propSchema: {
            user: {
                default: '',
            },
        },
        content: 'none',
    },
    {
        render: ic => {
            const dom = document.createElement('span')
            dom.appendChild(document.createTextNode('@' + ic.props.user))

            return {
                dom,
            }
        },
    }
)

/**
 * 标签内联内容定义
 */
const tag = createInlineContentSpec(
    {
        type: 'tag' as const,
        propSchema: {},
        content: 'styled',
    },
    {
        render: () => {
            const dom = document.createElement('span')
            dom.textContent = '#'

            const contentDOM = document.createElement('span')
            dom.appendChild(contentDOM)

            return {
                dom,
                contentDOM,
            }
        },
    }
)

/**
 * 自定义内联内容 schema
 */
const schema = LcwDocSchema.create({
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention,
        tag,
    },
})

/**
 * 自定义内联内容测试用例
 *
 * 使用包含自定义内联内容的 schema 创建编辑器并进行测试。
 */
export const customInlineContentTestCases: EditorTestCases<DefaultBlockSchema, typeof schema.inlineContentSchema, DefaultStyleSchema> = {
    name: 'custom inline content schema',
    createEditor: () => {
        return LcwDocEditor.create({
            uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
            schema,
        })
    },
    documents: [
        {
            name: 'mention/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        'I enjoy working with ',
                        {
                            type: 'mention',
                            props: {
                                user: 'Matthew',
                            },
                            content: undefined,
                        },
                    ],
                },
            ],
        },
        {
            name: 'tag/basic',
            blocks: [
                {
                    type: 'paragraph',
                    content: [
                        'I love ',
                        {
                            type: 'tag',
                            content: 'LcwDoc',
                        },
                    ],
                },
            ],
        },
    ],
}