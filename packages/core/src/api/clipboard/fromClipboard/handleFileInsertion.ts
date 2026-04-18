/**
 * 处理文件插入
 *
 * 该文件提供处理文件和剪贴板中文件插入的功能。
 * 根据文件类型和 MIME 类型创建相应的文件块。
 */
import { PartialBlock } from '../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, FileBlockConfig, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { getBlockInfo, getNearestBlockContainerPos } from '../../getBlockInfoFromPos'
import { acceptedMIMETypes } from './acceptedMIMETypes'

/**
 * 检查文件扩展名是否匹配
 *
 * @param fileExtension1 - 文件扩展名1
 * @param fileExtension2 - 文件扩展名2
 * @returns 返回是否匹配
 */
function checkFileExtensionsMatch(fileExtension1: string, fileExtension2: string) {
    if (!fileExtension1.startsWith('.') || !fileExtension2.startsWith('.')) {
        throw new Error(`The strings provided are not valid file extensions.`)
    }

    return fileExtension1 === fileExtension2
}

/**
 * 检查 MIME 类型是否匹配
 *
 * 支持通配符匹配，如 image/* 匹配任何图片类型。
 *
 * @param mimeType1 - MIME 类型1
 * @param mimeType2 - MIME 类型2
 * @returns 返回是否匹配
 */
function checkMIMETypesMatch(mimeType1: string, mimeType2: string) {
    const types1 = mimeType1.split('/')
    const types2 = mimeType2.split('/')

    if (types1.length !== 2) {
        throw new Error(`The string ${mimeType1} is not a valid MIME type.`)
    }
    if (types2.length !== 2) {
        throw new Error(`The string ${mimeType2} is not a valid MIME type.`)
    }

    if (types1[1] === '*' || types2[1] === '*') {
        return types1[0] === types2[0]
    }
    if (types1[0] === '*' || types2[0] === '*') {
        return types1[1] === types2[1]
    }

    return types1[0] === types2[0] && types1[1] === types2[1]
}

/**
 * 处理文件插入
 *
 * 异步函数，处理拖放或粘贴事件中的文件。
 * 根据文件类型创建相应的文件块，插入到编辑器中，
 * 并调用上传函数上传文件。
 *
 * @param event - 拖放或剪贴板事件
 * @param editor - 编辑器实例
 */
export async function handleFileInsertion<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    event: DragEvent | ClipboardEvent,
    editor: LcwDocEditor<BSchema, I, S>
) {
    if (!editor.uploadFile) {
        return
    }

    const dataTransfer = 'dataTransfer' in event ? event.dataTransfer : event.clipboardData
    if (dataTransfer === null) {
        return
    }

    let format: (typeof acceptedMIMETypes)[number] | null = null
    for (const mimeType of acceptedMIMETypes) {
        if (dataTransfer.types.includes(mimeType)) {
            format = mimeType
            break
        }
    }
    if (format !== 'Files') {
        return
    }

    const items = dataTransfer.items
    if (!items) {
        return
    }

    event.preventDefault()

    const fileBlockConfigs = Object.values(editor.schema.blockSchema).filter(blockConfig => blockConfig.isFileBlock) as FileBlockConfig[]

    for (let i = 0; i < items.length; i++) {
        let fileBlockType = 'file'
        for (const fileBlockConfig of fileBlockConfigs) {
            for (const mimeType of fileBlockConfig.fileBlockAccept || []) {
                const isFileExtension = mimeType.startsWith('.')
                const file = items[i].getAsFile()

                if (file) {
                    if (
                        (!isFileExtension && file.type && checkMIMETypesMatch(items[i].type, mimeType)) ||
                        (isFileExtension && checkFileExtensionsMatch('.' + file.name.split('.').pop(), mimeType))
                    ) {
                        fileBlockType = fileBlockConfig.type
                        break
                    }
                }
            }
        }

        const file = items[i].getAsFile()
        if (file) {
            const fileBlock = {
                type: fileBlockType,
                props: {
                    name: file.name,
                },
            } as PartialBlock<BSchema, I, S>

            let insertedBlockId: string | undefined = undefined

            if (event.type === 'paste') {
                insertedBlockId = editor.insertBlocks([fileBlock], editor.getTextCursorPosition().block, 'after')[0].id
            } else if (event.type === 'drop') {
                const coords = {
                    left: (event as DragEvent).clientX,
                    top: (event as DragEvent).clientY,
                }

                const pos = editor._tiptapEditor.view.posAtCoords(coords)
                if (!pos) {
                    return
                }

                const posInfo = getNearestBlockContainerPos(editor._tiptapEditor.state.doc, pos.pos)

                const blockInfo = getBlockInfo(posInfo)

                insertedBlockId = editor.insertBlocks([fileBlock], blockInfo.blockContainer.node.attrs.id, 'after')[0].id
            } else {
                return
            }

            const updateData = await editor.uploadFile(file, insertedBlockId)

            const updatedFileBlock =
                typeof updateData === 'string'
                    ? ({
                          props: {
                              url: updateData,
                          },
                      } as PartialBlock<BSchema, I, S>)
                    : { ...updateData }

            editor.updateBlock(insertedBlockId, updatedFileBlock)
        }
    }
}