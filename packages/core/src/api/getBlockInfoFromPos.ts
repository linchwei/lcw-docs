/**
 * 获取块信息工具
 *
 * 该文件提供从文档位置获取块相关信息的功能。
 * 用于获取块容器、块内容和块组的位置信息。
 */
import { Node, ResolvedPos } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'

/**
 * 单个块信息类型
 *
 * 包含节点及其前后位置。
 */
type SingleBlockInfo = {
    /** 节点 */
    node: Node
    /** 节点前面的位置 */
    beforePos: number
    /** 节点后面的位置 */
    afterPos: number
}

/**
 * 块信息类型
 *
 * 包含块容器、块内容和可选的块组信息。
 */
export type BlockInfo = {
    /** 块容器信息 */
    blockContainer: SingleBlockInfo
    /** 块内容信息 */
    blockContent: SingleBlockInfo
    /** 块组信息（可选） */
    blockGroup?: SingleBlockInfo
}

/**
 * 获取最近的块容器位置
 *
 * 从给定位置向上查找最近的 blockContainer 节点。
 * 如果位置不在 blockContainer 内，会遍历祖先节点。
 * 如果找不到，则返回文档中最近的 blockContainer。
 *
 * @param doc - 文档节点
 * @param pos - 位置
 * @returns 返回包含位置和节点信息的对象
 */
export function getNearestBlockContainerPos(doc: Node, pos: number) {
    const $pos = doc.resolve(pos)

    if ($pos.nodeAfter && $pos.nodeAfter.type.name === 'blockContainer') {
        return {
            posBeforeNode: $pos.pos,
            node: $pos.nodeAfter,
        }
    }

    let depth = $pos.depth
    let node = $pos.node(depth)
    while (depth > 0) {
        if (node.type.name === 'blockContainer') {
            return {
                posBeforeNode: $pos.before(depth),
                node: node,
            }
        }

        depth--
        node = $pos.node(depth)
    }

    const allBlockContainerPositions: number[] = []
    doc.descendants((node, pos) => {
        if (node.type.name === 'blockContainer') {
            allBlockContainerPositions.push(pos)
        }
    })

    console.warn(`Position ${pos} is not within a blockContainer node.`)

    const resolvedPos = doc.resolve(
        allBlockContainerPositions.find(position => position >= pos) || allBlockContainerPositions[allBlockContainerPositions.length - 1]
    )
    return {
        posBeforeNode: resolvedPos.pos,
        node: resolvedPos.nodeAfter!,
    }
}

/**
 * 从手动偏移量获取块信息
 *
 * 根据块容器节点和偏移量计算块容器、块内容和块组的位置信息。
 *
 * @param node - blockContainer 节点
 * @param blockContainerBeforePosOffset - 块容器前面的位置偏移
 * @returns 返回块信息对象
 */
export function getBlockInfoWithManualOffset(node: Node, blockContainerBeforePosOffset: number): BlockInfo {
    const blockContainerNode = node
    const blockContainerBeforePos = blockContainerBeforePosOffset
    const blockContainerAfterPos = blockContainerBeforePos + blockContainerNode.nodeSize

    const blockContainer: SingleBlockInfo = {
        node: blockContainerNode,
        beforePos: blockContainerBeforePos,
        afterPos: blockContainerAfterPos,
    }
    let blockContent: SingleBlockInfo | undefined = undefined
    let blockGroup: SingleBlockInfo | undefined = undefined

    blockContainerNode.forEach((node, offset) => {
        if (node.type.spec.group === 'blockContent') {
            const blockContentNode = node
            const blockContentBeforePos = blockContainerBeforePos + offset + 1
            const blockContentAfterPos = blockContentBeforePos + node.nodeSize

            blockContent = {
                node: blockContentNode,
                beforePos: blockContentBeforePos,
                afterPos: blockContentAfterPos,
            }
        } else if (node.type.name === 'blockGroup') {
            const blockGroupNode = node
            const blockGroupBeforePos = blockContainerBeforePos + offset + 1
            const blockGroupAfterPos = blockGroupBeforePos + node.nodeSize

            blockGroup = {
                node: blockGroupNode,
                beforePos: blockGroupBeforePos,
                afterPos: blockGroupAfterPos,
            }
        }
    })

    if (!blockContent) {
        throw new Error(`blockContainer node does not contain a blockContent node in its children: ${blockContainerNode}`)
    }

    return {
        blockContainer,
        blockContent,
        blockGroup,
    }
}

/**
 * 从位置信息获取块信息
 *
 * @param posInfo - 包含位置和节点信息的对象
 * @returns 返回块信息对象
 */
export function getBlockInfo(posInfo: { posBeforeNode: number; node: Node }) {
    return getBlockInfoWithManualOffset(posInfo.node, posInfo.posBeforeNode)
}

/**
 * 从解析后的位置获取块信息
 *
 * @param resolvedPos - 解析后的位置
 * @returns 返回块信息对象
 */
export function getBlockInfoFromResolvedPos(resolvedPos: ResolvedPos) {
    if (!resolvedPos.nodeAfter) {
        throw new Error(`Attempted to get blockContainer node at position ${resolvedPos.pos} but a node at this position does not exist`)
    }
    if (resolvedPos.nodeAfter.type.name !== 'blockContainer') {
        throw new Error(
            `Attempted to get blockContainer node at position ${resolvedPos.pos} but found node of different type ${resolvedPos.nodeAfter}`
        )
    }
    return getBlockInfoWithManualOffset(resolvedPos.nodeAfter, resolvedPos.pos)
}

/**
 * 从选择状态获取块信息
 *
 * @param state - 编辑器状态
 * @returns 返回块信息对象
 */
export function getBlockInfoFromSelection(state: EditorState) {
    const posInfo = getNearestBlockContainerPos(state.doc, state.selection.anchor)
    return getBlockInfo(posInfo)
}