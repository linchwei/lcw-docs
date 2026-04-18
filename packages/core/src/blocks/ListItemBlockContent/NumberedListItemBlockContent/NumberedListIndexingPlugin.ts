/**
 * 有序列表索引插件模块
 * 自动为有序列表项分配和更新序号
 */
import { Plugin, PluginKey } from 'prosemirror-state'

import { getBlockInfo } from '../../../api/getBlockInfoFromPos'

const PLUGIN_KEY = new PluginKey(`numbered-list-indexing`)

/**
 * 有序列表索引插件
 * 在事务处理后自动更新有序列表项的序号
 */
export const NumberedListIndexingPlugin = () => {
    return new Plugin({
        key: PLUGIN_KEY,
        appendTransaction: (_transactions, _oldState, newState) => {
            const tr = newState.tr
            tr.setMeta('numberedListIndexing', true)

            let modified = false

            newState.doc.descendants((node, pos) => {
                if (node.type.name === 'blockContainer' && node.firstChild!.type.name === 'numberedListItem') {
                    let newIndex = '1'

                    const blockInfo = getBlockInfo({
                        posBeforeNode: pos,
                        node,
                    })

                    const prevBlock = tr.doc.resolve(blockInfo.blockContainer.beforePos).nodeBefore

                    if (prevBlock) {
                        const prevBlockInfo = getBlockInfo({
                            posBeforeNode: blockInfo.blockContainer.beforePos - prevBlock.nodeSize,
                            node: prevBlock,
                        })

                        const isPrevBlockOrderedListItem = prevBlockInfo.blockContent.node.type.name === 'numberedListItem'

                        if (isPrevBlockOrderedListItem) {
                            const prevBlockIndex = prevBlockInfo.blockContent.node.attrs['index']

                            newIndex = (parseInt(prevBlockIndex) + 1).toString()
                        }
                    }

                    const contentNode = blockInfo.blockContent.node
                    const index = contentNode.attrs['index']

                    if (index !== newIndex) {
                        modified = true

                        tr.setNodeMarkup(blockInfo.blockContent.beforePos, undefined, {
                            index: newIndex,
                        })
                    }
                }
            })

            return modified ? tr : null
        },
    })
}
