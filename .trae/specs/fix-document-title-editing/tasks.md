# Tasks

- [x] Task 1: 修复前端标题编辑 - 移除 dangerouslySetInnerHTML，改用 useRef 同步方案
  - [x] SubTask 1.1: 移除标题 div 上的 `dangerouslySetInnerHTML` 属性
  - [x] SubTask 1.2: 添加 `useRef` 引用标题 div，在 page 数据变化时手动同步 innerHTML（仅当焦点不在标题上时）
  - [x] SubTask 1.3: 修复 `handleTitleInput`：使用 `useCallback` + `useRef` 稳定 debounce 引用，避免闭包问题
  - [x] SubTask 1.4: 更新成功后刷新当前页面查询 `queryClient.invalidateQueries({ queryKey: ['page', params?.id] })`

- [x] Task 2: 修复后端 page update 相关 bug
  - [x] SubTask 2.1: 修复 `page.service.ts` 的 `update` 方法：`return new NotFoundException` 改为 `throw new NotFoundException`
  - [x] SubTask 2.2: 修复 `page.service.ts` 的 `update` 方法：过滤 payload 只保留 title 和 emoji 字段
  - [x] SubTask 2.3: 修复 `page.service.ts` 的 `update` 方法：更新后 findOne 返回数据库实际数据
  - [x] SubTask 2.4: 修复 `page.service.ts` 的 `fetch` 方法：`return new NotFoundException` 改为 `throw new NotFoundException`
  - [x] SubTask 2.5: 在 `page.dto.ts` 中添加 `updatePageSchema`，在 `page.controller.ts` 的 update 方法添加 ZodValidationPipe

# Task Dependencies
- [Task 2] 和 [Task 1] 可并行执行
