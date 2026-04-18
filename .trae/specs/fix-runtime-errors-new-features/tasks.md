# Tasks

- [x] Task 1: 修复 CollaboratorEntity — 移除 @ManyToOne page 关系，保留 @Column pageId 并修正 length 为 80
- [x] Task 2: 修复 NotificationBell — 移除 ScrollArea 导入，使用 div + overflow-y-auto 替代
- [x] Task 3: 检查 NotificationEntity 的双重 ManyToOne 关系兼容性
- [x] Task 4: 启动后端服务验证无报错
- [x] Task 5: 启动前端服务验证无报错
- [x] Task 6: 安装缺失的 sonner 依赖（CollaboratorPanel 需要）
- [x] Task 7: 修复 CollaboratorService 引用已移除的 page 关系
- [x] Task 8: 通过 MCP 浏览器验证前端页面正常加载，无控制台错误
- [x] Task 9: 通过 MCP 浏览器验证后端 API 正常响应

# Task Dependencies
- [Task 4] depends on [Task 1, 3]
- [Task 5] depends on [Task 2, 6]
- [Task 7] depends on [Task 1]
- [Task 8] depends on [Task 5]
- [Task 9] depends on [Task 4]
