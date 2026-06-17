/**
 * 模板类型定义
 *
 * 前端模板接口定义，与后端 Template/TemplateCategory 实体对齐。
 * 模板数据从服务端 API 获取，不再硬编码。
 *
 * @see services/template.ts - API 调用服务
 */

/** 文档模板 */
export interface Template {
    id: string
    name: string
    category: string
    description: string
    emoji: string
    content: string
}

/** 模板分类 */
export interface TemplateCategory {
    id: string
    name: string
    emoji: string
}
