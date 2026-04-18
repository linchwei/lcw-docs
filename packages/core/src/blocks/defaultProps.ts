/**
 * 默认属性定义模块
 * 定义所有块类型共享的默认属性
 * 包括背景颜色、文字颜色和文本对齐方式
 */
import type { Props, PropSchema } from '../schema/index'

/**
 * 默认属性模式
 * 定义编辑器块支持的全局属性
 */
export const defaultProps = {
    backgroundColor: {
        default: 'default' as const,
    },
    textColor: {
        default: 'default' as const,
    },
    textAlignment: {
        default: 'left' as const,
        values: ['left', 'center', 'right', 'justify'] as const,
    },
} satisfies PropSchema

export type DefaultProps = Props<typeof defaultProps>

/**
 * 可继承属性列表
 * 这些属性会从父块传递到子块
 */
export const inheritedProps = ['backgroundColor', 'textColor']
