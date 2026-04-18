# Tasks

- [x] Task 1: 后端新增批量获取页面标签接口
  - [x] SubTask 1.1: 在 tag.dto.ts 中添加 batchGetPageTagsSchema Zod 校验
  - [x] SubTask 1.2: 在 tag.service.ts 中实现 batchGetPageTags 方法
  - [x] SubTask 1.3: 在 tag.controller.ts 中添加 POST /page-tags/batch 端点

- [x] Task 2: 后端为 tag 读取端点放宽限流
  - [x] SubTask 2.1: 为 tag.controller.ts 中的读取端点添加 @Throttle() 装饰器

- [x] Task 3: 前端消除 DocList 标签 N+1 查询
  - [x] SubTask 3.1: 在 tag.ts 服务中添加 batchFetchPageTags 方法
  - [x] SubTask 3.2: 在 DocList/index.tsx 中将 PageCard 和 SharedPageCard 的独立 useQuery 替换为列表层批量查询

- [x] Task 4: 前端 QueryClient 缓存优化
  - [x] SubTask 4.1: 在 query-client.ts 中配置默认 staleTime: 30_000

# Task Dependencies
- [Task 3] depends on [Task 1]（前端批量查询依赖后端批量接口）
- [Task 2] independent
- [Task 4] independent
