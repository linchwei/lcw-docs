/**
 * 复选框添加空格 Rehype 插件
 *
 * 该插件在复选框 input 元素后添加空格。
 * 因为 remark 不会在复选框和文本之间添加空格，
 * 但这对于正确的 Markdown 语法是必需的。
 */
import { Element as HASTElement, Parent as HASTParent } from 'hast'

import { esmDependencies } from '../../../../util/esmDependencies'

/**
 * 添加空格到复选框
 *
 * @returns 返回 rehype 插件函数
 */
export function addSpacesToCheckboxes() {
    const deps = esmDependencies

    if (!deps) {
        throw new Error('addSpacesToCheckboxes requires ESM dependencies to be initialized')
    }

    const helper = (tree: HASTParent) => {
        if (tree.children && 'length' in tree.children && tree.children.length) {
            for (let i = tree.children.length - 1; i >= 0; i--) {
                const child = tree.children[i]
                const nextChild = i + 1 < tree.children.length ? tree.children[i + 1] : undefined

                if (
                    child.type === 'element' &&
                    child.tagName === 'input' &&
                    child.properties?.type === 'checkbox' &&
                    nextChild?.type === 'element' &&
                    nextChild.tagName === 'p'
                ) {
                    nextChild.tagName = 'span'
                    nextChild.children.splice(0, 0, deps.hastUtilFromDom.fromDom(document.createTextNode(' ')) as HASTElement)
                } else {
                    helper(child as HASTParent)
                }
            }
        }
    }

    return helper
}