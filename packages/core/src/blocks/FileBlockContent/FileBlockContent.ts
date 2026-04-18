/**
 * 文件块内容模块
 * 定义编辑器中的通用文件块，支持文件预览和下载
 */
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { BlockFromConfig, createBlockSpec, FileBlockConfig, PropSchema } from '../../schema/index'
import { defaultProps } from '../defaultProps'
import {
    createDefaultFilePreview,
    createFileAndCaptionWrapper,
    createFileBlockWrapper,
    createLinkWithCaption,
    parseEmbedElement,
    parseFigureElement,
} from './fileBlockHelpers'

/**
 * 文件块的属性模式定义
 * 包含背景颜色、名称、URL 和标题
 */
export const filePropSchema = {
    backgroundColor: defaultProps.backgroundColor,
    name: {
        default: '' as const,
    },
    url: {
        default: '' as const,
    },
    caption: {
        default: '' as const,
    },
} satisfies PropSchema

/**
 * 文件块的配置定义
 * 标记为文件块
 */
export const fileBlockConfig = {
    type: 'file' as const,
    propSchema: filePropSchema,
    content: 'none',
    isFileBlock: true,
} satisfies FileBlockConfig

/**
 * 文件块渲染函数
 * 创建包含文件预览和文件块包装器的 DOM 结构
 */
export const fileRender = (block: BlockFromConfig<typeof fileBlockConfig, any, any>, editor: LcwDocEditor<any, any, any>) => {
    const file = createDefaultFilePreview(block).dom
    const element = createFileAndCaptionWrapper(block, file)

    return createFileBlockWrapper(block, editor, element)
}

/**
 * 文件块解析函数
 * 从 HTML 元素解析文件块的属性
 * 支持 embed 和 figure 标签
 */
export const fileParse = (element: HTMLElement) => {
    if (element.tagName === 'EMBED') {
        return parseEmbedElement(element as HTMLEmbedElement)
    }

    if (element.tagName === 'FIGURE') {
        const parsedFigure = parseFigureElement(element, 'embed')
        if (!parsedFigure) {
            return undefined
        }

        const { targetElement, caption } = parsedFigure

        return {
            ...parseEmbedElement(targetElement as HTMLEmbedElement),
            caption,
        }
    }

    return undefined
}

/**
 * 文件块转换为外部 HTML
 * 用于导出或复制操作
 */
export const fileToExternalHTML = (block: BlockFromConfig<typeof fileBlockConfig, any, any>) => {
    if (!block.props.url) {
        const div = document.createElement('p')
        div.textContent = 'Add file'

        return {
            dom: div,
        }
    }

    const fileSrcLink = document.createElement('a')
    fileSrcLink.href = block.props.url
    fileSrcLink.textContent = block.props.name || block.props.url

    if (block.props.caption) {
        return createLinkWithCaption(fileSrcLink, block.props.caption)
    }

    return {
        dom: fileSrcLink,
    }
}

/**
 * 文件块完整定义
 */
export const FileBlock = createBlockSpec(fileBlockConfig, {
    render: fileRender,
    parse: fileParse,
    toExternalHTML: fileToExternalHTML,
})
