# Tasks

- [x] Task 1: 修复 PDF 导出空白问题
  - [x] SubTask 1.1: 修改 exportDocument.ts 中的 exportPDF 函数，使用 iframe + srcdoc 方式渲染完整 HTML 文档
  - [x] SubTask 1.2: 添加 iframe 加载等待和错误处理逻辑
  - [x] SubTask 1.3: 浏览器测试验证 PDF 导出内容完整

- [x] Task 2: 创建模板数据定义文件
  - [x] SubTask 2.1: 创建 apps/web/src/data/templates.ts，定义模板分类和 14 个模板的 Markdown 内容
  - [x] SubTask 2.2: 定义 TemplateCategory 和 Template 类型接口

- [x] Task 3: 创建模板选择对话框组件
  - [x] SubTask 3.1: 创建 apps/web/src/components/TemplateDialog/index.tsx
  - [x] SubTask 3.2: 实现分类 Tab 切换、模板卡片网格、搜索过滤功能
  - [x] SubTask 3.3: 实现模板预览和"使用此模板"按钮

- [x] Task 4: 集成模板创建流程
  - [x] SubTask 4.1: 修改 DocList/index.tsx，添加"从模板创建"按钮和 TemplateDialog
  - [x] SubTask 4.2: 修改 Aside.tsx，添加"从模板创建"入口
  - [x] SubTask 4.3: 修改 Doc/index.tsx 的 handleEditorReady，增加模板内容注入逻辑（读取 sessionStorage 中的 template-pending-markdown）
  - [x] SubTask 4.4: 实现模板选择后的完整流程：存 sessionStorage → createPage → navigate → replaceBlocks

- [x] Task 5: 浏览器测试验证
  - [x] SubTask 5.1: 测试 PDF 导出内容完整
  - [x] SubTask 5.2: 测试每个分类的模板创建流程
  - [x] SubTask 5.3: 测试模板搜索功能
  - [x] SubTask 5.4: 测试从侧边栏和文档列表页创建模板文档

# Task Dependencies
- [Task 2] depends on nothing (可独立开始)
- [Task 3] depends on [Task 2] (需要模板数据类型)
- [Task 4] depends on [Task 3] (需要 TemplateDialog 组件)
- [Task 1] depends on nothing (可独立开始，与 Task 2-4 并行)
- [Task 5] depends on [Task 1, Task 4]
