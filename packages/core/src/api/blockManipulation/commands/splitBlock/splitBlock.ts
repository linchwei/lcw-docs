/**
 * 分割块
 *
 * 该文件提供块分割功能，用于在编辑器中把一个块分割成两个块。
 * 通常在用户按下回车键时触发，将当前块的内容分割成两个块。
 */
import { EditorState } from 'prosemirror-state'

import { getBlockInfo, getNearestBlockContainerPos } from '../../../getBlockInfoFromPos'

/**
 * 分割块命令
 *
 * 创建一个命令，用于在指定位置将块分割成两个。
 *
 * @param posInBlock - 块内的分割位置
 * @param keepType - 是否保留原块的类型，默认为 false（使用段落类型）
 * @param keepProps - 是否保留原块的属性，默认为 false
 * @returns 返回命令函数
 */
export const splitBlockCommand = (posInBlock: number, keepType?: boolean, keepProps?: boolean) => {
    return ({ state, dispatch }: { state: EditorState; dispatch: ((args?: any) => any) | undefined }) => {
        const nearestBlockContainerPos = getNearestBlockContainerPos(state.doc, posInBlock)

        const { blockContainer, blockContent } = getBlockInfo(nearestBlockContainerPos)

        const types = [
            {
                type: blockContainer.node.type,
                attrs: keepProps ? { ...blockContainer.node.attrs, id: undefined } : {},
            },
            {
                type: keepType ? blockContent.node.type : state.schema.nodes['paragraph'],
                attrs: keepProps ? { ...blockContent.node.attrs } : {},
            },
        ]

        if (dispatch) {
            state.tr.split(posInBlock, 2, types)
        }

        return true
    }
}