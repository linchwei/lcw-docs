/**
 * 节点工具
 *
 * 该文件提供节点相关的工具函数。
 */
import { Node } from 'prosemirror-model'

/**
 * 根据 ID 获取节点
 *
 * 在文档中查找具有指定 ID 的 blockContainer 节点。
 *
 * @param id - 要查找的节点 ID
 * @param doc - 文档节点
 * @returns 返回包含节点和节点前面位置的对象
 * @throws 如果找不到匹配的 ID，抛出错误
 */
export function getNodeById(id: string, doc: Node): { node: Node; posBeforeNode: number } {
    let targetNode: Node | undefined = undefined
    let posBeforeNode: number | undefined = undefined

    doc.firstChild!.descendants((node, pos) => {
        if (targetNode) {
            return false
        }

        if (node.type.name !== 'blockContainer' || node.attrs.id !== id) {
            return true
        }

        targetNode = node
        posBeforeNode = pos + 1

        return false
    })

    if (targetNode === undefined || posBeforeNode === undefined) {
        throw Error('Could not find block in the editor with matching ID.')
    }

    return {
        node: targetNode,
        posBeforeNode: posBeforeNode,
    }
}