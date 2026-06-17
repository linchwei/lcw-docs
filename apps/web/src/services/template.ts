/**
 * 模板 API 服务
 *
 * 从服务端获取文档模板和分类数据。
 * 替代前端硬编码的 templates.ts，支持动态增删模板和分类。
 *
 * @module services/template
 */

/** 模板分类 */
export interface TemplateCategory {
    categoryId: string
    name: string
    emoji: string
    sortOrder: number
    isActive: boolean
}

/** 文档模板 */
export interface Template {
    templateId: string
    name: string
    categoryId: string
    description: string
    emoji: string
    content: string
    sortOrder: number
    isActive: boolean
}

/**
 * 获取所有启用的模板分类
 *
 * @returns 分类列表，按 sortOrder 排序
 */
export async function fetchTemplateCategories(): Promise<TemplateCategory[]> {
    const response = await fetch('/api/template-categories')
    if (!response.ok) {
        throw new Error(`获取模板分类失败 (HTTP ${response.status})`)
    }
    const result = await response.json()
    if (result.success) {
        return result.data
    }
    throw new Error(result.message || '获取模板分类失败')
}

/**
 * 获取所有启用的模板
 *
 * @param categoryId - 可选，按分类过滤
 * @returns 模板列表，按 sortOrder 排序
 */
export async function fetchTemplates(categoryId?: string): Promise<Template[]> {
    const params = new URLSearchParams()
    if (categoryId) {
        params.set('categoryId', categoryId)
    }
    const url = `/api/templates${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`获取模板列表失败 (HTTP ${response.status})`)
    }
    const result = await response.json()
    if (result.success) {
        return result.data
    }
    throw new Error(result.message || '获取模板列表失败')
}

/**
 * 获取单个模板
 *
 * @param templateId - 模板 ID
 * @returns 模板详情
 */
export async function fetchTemplate(templateId: string): Promise<Template> {
    const response = await fetch(`/api/templates/${templateId}`)
    if (!response.ok) {
        throw new Error(`获取模板详情失败 (HTTP ${response.status})`)
    }
    const result = await response.json()
    if (result.success) {
        return result.data
    }
    throw new Error(result.message || '获取模板详情失败')
}
