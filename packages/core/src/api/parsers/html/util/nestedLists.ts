/**
 * 嵌套列表处理工具
 *
 * 该文件提供处理 HTML 中嵌套列表结构的工具函数。
 * 将嵌套在列表项中的子列表提升到正确的层级，
 * 并创建适合编辑器结构的块组。
 */

/**
 * 获取节点在其父节点中的索引
 *
 * @param node - DOM 元素节点
 * @returns 返回节点在其父节点中的位置索引
 */
function getChildIndex(node: Element) {
    return Array.prototype.indexOf.call(node.parentElement!.childNodes, node)
}

/**
 * 检查节点是否为空白文本节点
 *
 * @param node - DOM 节点
 * @returns 返回是否是空白文本节点
 */
function isWhitespaceNode(node: Node) {
    return node.nodeType === 3 && !/\S/.test(node.nodeValue || '')
}

/**
 * 将嵌套在 li 中的子列表提升到父级
 *
 * 处理嵌套列表结构，将 li 下的 ul/ol 移到 li 之后，
 * 并将后续兄弟节点包装在新的 li 中。
 */
function liftNestedListsToParent(element: HTMLElement) {
    element.querySelectorAll('li > ul, li > ol').forEach(list => {
        const index = getChildIndex(list)
        const parentListItem = list.parentElement!
        const siblingsAfter = Array.from(parentListItem.childNodes).slice(index + 1)
        list.remove()
        siblingsAfter.forEach(sibling => {
            sibling.remove()
        })

        parentListItem.insertAdjacentElement('afterend', list)

        siblingsAfter.reverse().forEach(sibling => {
            if (isWhitespaceNode(sibling)) {
                return
            }
            const siblingContainer = document.createElement('li')
            siblingContainer.append(sibling)
            list.insertAdjacentElement('afterend', siblingContainer)
        })
        if (parentListItem.childNodes.length === 0) {
            parentListItem.remove()
        }
    })
}

/**
 * 为连续列表创建块组结构
 *
 * 将 li + ul/ol 的模式转换为块容器和块组结构，
 * 使编辑器能够正确处理列表项及其后续列表。
 */
function createGroups(element: HTMLElement) {
    element.querySelectorAll('li + ul, li + ol').forEach(list => {
        const listItem = list.previousElementSibling as HTMLElement
        const blockContainer = document.createElement('div')

        listItem.insertAdjacentElement('afterend', blockContainer)
        blockContainer.append(listItem)

        const blockGroup = document.createElement('div')
        blockGroup.setAttribute('data-node-type', 'blockGroup')
        blockContainer.append(blockGroup)

        while (blockContainer.nextElementSibling?.nodeName === 'UL' || blockContainer.nextElementSibling?.nodeName === 'OL') {
            blockGroup.append(blockContainer.nextElementSibling)
        }
    })
}

/**
 * 创建分离的 HTML 文档
 *
 * 创建一个不连接到活跃文档的 HTML 文档，
 * 用于解析 HTML 字符串时避免样式冲突。
 */
let _detachedDoc: Document | null = null
function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument('title'))
}

/**
 * 将 HTML 元素或字符串转换为编辑器文档结构
 *
 * 入口函数，处理嵌套列表并创建块组结构。
 *
 * @param elementOrHTML - HTML 元素或 HTML 字符串
 * @returns 返回处理后的 DOM 元素
 */
export function nestedListsToLcwDocStructure(elementOrHTML: HTMLElement | string) {
    if (typeof elementOrHTML === 'string') {
        const element = detachedDoc().createElement('div')
        element.innerHTML = elementOrHTML
        elementOrHTML = element
    }
    liftNestedListsToParent(elementOrHTML)
    createGroups(elementOrHTML)
    return elementOrHTML
}