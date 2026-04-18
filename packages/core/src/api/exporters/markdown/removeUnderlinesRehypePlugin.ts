/**
 * 移除下划线 Rehype 插件
 *
 * 该插件在将 HTML 转换为 Markdown 之前移除下划线标签。
 * 因为 Markdown 不支持下划线语法。
 */
import { Element as HASTElement, Parent as HASTParent } from 'hast'

/**
 * 移除下划线
 *
 * @returns 返回 rehype 插件函数
 */
export function removeUnderlines() {
    const removeUnderlinesHelper = (tree: HASTParent) => {
        let numChildElements = tree.children.length

        for (let i = 0; i < numChildElements; i++) {
            const node = tree.children[i]

            if (node.type === 'element') {
                removeUnderlinesHelper(node)

                if ((node as HASTElement).tagName === 'u') {
                    if (node.children.length > 0) {
                        tree.children.splice(i, 1, ...node.children)

                        const numElementsAdded = node.children.length - 1
                        numChildElements += numElementsAdded
                        i += numElementsAdded
                    } else {
                        tree.children.splice(i, 1)

                        numChildElements--
                        i--
                    }
                }
            }
        }
    }

    return removeUnderlinesHelper
}