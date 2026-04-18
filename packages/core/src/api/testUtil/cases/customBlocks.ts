/**
 * 自定义块测试用例
 *
 * 该文件定义使用自定义块的编辑器测试用例。
 * 包含 SimpleImage、CustomParagraph 和 SimpleCustomParagraph 等自定义块类型。
 */
import { defaultBlockSpecs, DefaultInlineContentSchema, DefaultStyleSchema } from '../../../blocks/defaultBlocks'
import { defaultProps } from '../../../blocks/defaultProps'
import { uploadToTmpFilesDotOrg_DEV_ONLY } from '../../../blocks/FileBlockContent/uploadToTmpFilesDotOrg_DEV_ONLY'
import { imagePropSchema, imageRender } from '../../../blocks/ImageBlockContent/ImageBlockContent'
import { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { LcwDocSchema } from '../../../editor/LcwDocSchema'
import { createBlockSpec } from '../../../schema/index'
import { EditorTestCases } from '../index'

/**
 * 简单图片块定义
 */
const SimpleImage = createBlockSpec(
    {
        type: 'simpleImage',
        propSchema: imagePropSchema,
        content: 'none',
    },
    {
        render: (block, editor) => imageRender(block as any, editor as any),
    }
)

/**
 * 自定义段落块定义
 */
const CustomParagraph = createBlockSpec(
    {
        type: 'customParagraph',
        propSchema: defaultProps,
        content: 'inline',
    },
    {
        render: () => {
            const paragraph = document.createElement('p')
            paragraph.className = 'custom-paragraph'

            return {
                dom: paragraph,
                contentDOM: paragraph,
            }
        },
        toExternalHTML: () => {
            const paragraph = document.createElement('p')
            paragraph.className = 'custom-paragraph'
            paragraph.innerHTML = 'Hello World'

            return {
                dom: paragraph,
            }
        },
    }
)

/**
 * 简单自定义段落块定义
 */
const SimpleCustomParagraph = createBlockSpec(
    {
        type: 'simpleCustomParagraph',
        propSchema: defaultProps,
        content: 'inline',
    },
    {
        render: () => {
            const paragraph = document.createElement('p')
            paragraph.className = 'simple-custom-paragraph'

            return {
                dom: paragraph,
                contentDOM: paragraph,
            }
        },
    }
)

/**
 * 自定义 schema
 */
const schema = LcwDocSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        simpleImage: SimpleImage,
        customParagraph: CustomParagraph,
        simpleCustomParagraph: SimpleCustomParagraph,
    },
})

/**
 * 自定义块测试用例
 *
 * 使用包含自定义块的 schema 创建编辑器并进行测试。
 */
export const customBlocksTestCases: EditorTestCases<typeof schema.blockSchema, DefaultInlineContentSchema, DefaultStyleSchema> = {
    name: 'custom blocks schema',
    createEditor: () => {
        return LcwDocEditor.create({
            schema,
            uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
        })
    },
    documents: [
        {
            name: 'simpleImage/button',
            blocks: [
                {
                    type: 'simpleImage',
                },
            ],
        },
        {
            name: 'simpleImage/basic',
            blocks: [
                {
                    type: 'simpleImage',
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
            name: 'simpleImage/noName',
            blocks: [
                {
                    type: 'simpleImage',
                    props: {
                        url: 'exampleURL',
                        caption: 'Caption',
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'simpleImage/noCaption',
            blocks: [
                {
                    type: 'simpleImage',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        previewWidth: 256,
                    },
                },
            ],
        },
        {
            name: 'simpleImage/noPreview',
            blocks: [
                {
                    type: 'simpleImage',
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
            name: 'simpleImage/nested',
            blocks: [
                {
                    type: 'simpleImage',
                    props: {
                        name: 'example',
                        url: 'exampleURL',
                        caption: 'Caption',
                        previewWidth: 256,
                    },
                    children: [
                        {
                            type: 'simpleImage',
                            props: {
                                name: 'example',
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
            name: 'customParagraph/basic',
            blocks: [
                {
                    type: 'customParagraph',
                    content: 'Custom Paragraph',
                },
            ],
        },
        {
            name: 'customParagraph/styled',
            blocks: [
                {
                    type: 'customParagraph',
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
            name: 'customParagraph/nested',
            blocks: [
                {
                    type: 'customParagraph',
                    content: 'Custom Paragraph',
                    children: [
                        {
                            type: 'customParagraph',
                            content: 'Nested Custom Paragraph 1',
                        },
                        {
                            type: 'customParagraph',
                            content: 'Nested Custom Paragraph 2',
                        },
                    ],
                },
            ],
        },
        {
            name: 'customParagraph/lineBreaks',
            blocks: [
                {
                    type: 'customParagraph',
                    content: 'Line 1\nLine 2',
                },
            ],
        },
        {
            name: 'simpleCustomParagraph/basic',
            blocks: [
                {
                    type: 'simpleCustomParagraph',
                    content: 'Custom Paragraph',
                },
            ],
        },
        {
            name: 'simpleCustomParagraph/styled',
            blocks: [
                {
                    type: 'simpleCustomParagraph',
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
            name: 'simpleCustomParagraph/nested',
            blocks: [
                {
                    type: 'simpleCustomParagraph',
                    content: 'Custom Paragraph',
                    children: [
                        {
                            type: 'simpleCustomParagraph',
                            content: 'Nested Custom Paragraph 1',
                        },
                        {
                            type: 'simpleCustomParagraph',
                            content: 'Nested Custom Paragraph 2',
                        },
                    ],
                },
            ],
        },
    ],
}