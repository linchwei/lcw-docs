import { xml2js } from 'xml-js'
export type YjsXML = string

export const yjsXmlMentionCollect = (xml: YjsXML) => {
    let docObject: any
    try {
        docObject = xml2js(xml)
    } catch {
        return []
    }

    /**
     * 妙-码
     * 1. 从 docObject 中提取出所有 mention 的 id
     */

    const mentionIds: string[] = []
    function recMention(content: any) {
        if (!content) {
            return
        }
        if (content.name === 'mention') {
            mentionIds.push(content.attributes.id)
        } else {
            content.elements?.forEach(recMention)
        }
    }
    docObject.elements.forEach(recMention)
    return mentionIds
}

// 转化后的大结构
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const converted = {
    elements: [
        {
            type: 'element',
            name: 'undefined',
            elements: [
                {
                    type: 'element',
                    name: 'blockgroup',
                    elements: [
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'initialBlockId', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '发送到发送到士大夫撒旦法撒旦法' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'fbfdffaf-d768-42fa-b99a-9af75d90fcd0', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'heading',
                                    attributes: { level: '1', textAlignment: 'left' },
                                    elements: [{ type: 'text', text: 'Lcw' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '39001f5d-908c-4bbf-a750-692cc27bf4a2', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'heading',
                                    attributes: { level: '2', textAlignment: 'left' },
                                    elements: [{ type: 'text', text: 'lcw' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '8e047c73-9e87-453d-81fb-e4dae103c5c9', textColor: 'default' },
                            elements: [{ type: 'element', name: 'paragraph', attributes: { textAlignment: 'left' } }],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '3734d23b-3821-4033-ae62-0f79adb9687d', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '12@' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'ed4c31f5-2b32-4937-92df-c2511a180ac7', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '2@' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'ca8749be-3172-4f1b-8687-556b25e19bf4', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '1232122r2' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '3ea829cb-46d2-4f5f-9f61-9350ecf91c0b', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'element', name: 'mention', attributes: { id: 'pageX1elYh' } }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '55cb0aee-932f-4984-92f0-1f3d39e2b140', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: 'sdf ' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'b2982df5-2637-4c00-ac18-4ec0cd446f3c', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '12-妙-码' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '37b4bbeb-3f15-4798-bc3c-703a6c77a712', textColor: 'default' },
                            elements: [{ type: 'element', name: 'paragraph', attributes: { textAlignment: 'left' } }],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'b70be7a6-a473-4eb1-90a9-7cb6dce55a99', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'text', text: '林一' }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: '9aa6417f-0182-496a-bc7e-af4cffc4138a', textColor: 'default' },
                            elements: [
                                {
                                    type: 'element',
                                    name: 'paragraph',
                                    attributes: { textAlignment: 'left' },
                                    elements: [{ type: 'element', name: 'mention', attributes: { id: 'pageBjAgTj' } }],
                                },
                            ],
                        },
                        {
                            type: 'element',
                            name: 'blockcontainer',
                            attributes: { backgroundColor: 'default', id: 'ede90444-6f8b-434c-b440-0e3892967c2d', textColor: 'default' },
                            elements: [{ type: 'element', name: 'paragraph', attributes: { textAlignment: 'left' } }],
                        },
                    ],
                },
            ],
        },
    ],
}
