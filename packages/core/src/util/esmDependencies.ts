/**
 * ESM 依赖处理模块
 * 提供 ESM 模块的动态导入和缓存管理功能
 * 用于延迟加载 rehype、remark 等 markdown 处理相关的依赖
 */

/**
 * ESM 依赖的全局缓存变量
 * 在 initializeESMDependencies 初始化后存储所有依赖模块
 */
export let esmDependencies:
    | undefined
    | {
          rehypeParse: typeof import('rehype-parse')
          rehypeStringify: typeof import('rehype-stringify')
          unified: typeof import('unified')
          hastUtilFromDom: typeof import('hast-util-from-dom')
          rehypeRemark: typeof import('rehype-remark')
          remarkGfm: typeof import('remark-gfm')
          remarkStringify: typeof import('remark-stringify')
          remarkParse: typeof import('remark-parse')
          remarkRehype: typeof import('remark-rehype')
          rehypeFormat: typeof import('rehype-format')
      }

/**
 * 初始化 ESM 依赖
 * 使用 Promise.all 并行动态导入所有依赖模块，并缓存结果
 * 如果依赖已经初始化过，直接返回缓存的结果
 * @returns 包含所有 ESM 依赖模块的对象
 */
export async function initializeESMDependencies() {
    if (esmDependencies) {
        return esmDependencies
    }
    const vals = await Promise.all([
        import('rehype-parse'),
        import('rehype-stringify'),
        import('unified'),
        import('hast-util-from-dom'),
        import('rehype-remark'),
        import('remark-gfm'),
        import('remark-stringify'),
        import('remark-parse'),
        import('remark-rehype'),
        import('rehype-format'),
    ])

    esmDependencies = {
        rehypeParse: vals[0],
        rehypeStringify: vals[1],
        unified: vals[2],
        hastUtilFromDom: vals[3],
        rehypeRemark: vals[4],
        remarkGfm: vals[5],
        remarkStringify: vals[6],
        remarkParse: vals[7],
        remarkRehype: vals[8],
        rehypeFormat: vals[9],
    }

    return esmDependencies
}