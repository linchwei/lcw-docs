# Tasks

- [x] Task 1: 实现搜索弹窗组件
  - [x] Task 1.1: 创建 `SearchDialog.tsx` 组件，使用 `@radix-ui/react-dialog`（已有依赖）实现模态弹窗
  - [x] Task 1.2: 实现搜索输入框和文档列表过滤逻辑（基于 fetchPageList 数据，前端过滤标题关键词）
  - [x] Task 1.3: 实现点击搜索结果跳转到对应文档页面并关闭弹窗
  - [x] Task 1.4: 实现键盘快捷键 ⌘K / Ctrl+K 打开搜索弹窗
  - [x] Task 1.5: 实现按 Escape 或点击外部关闭弹窗

- [x] Task 2: 实现设置弹窗组件
  - [x] Task 2.1: 创建 `SettingsDialog.tsx` 组件，使用 `@radix-ui/react-dialog` 实现模态弹窗
  - [x] Task 2.2: 展示当前用户信息和基本设置选项

- [x] Task 3: 实现关于弹窗组件
  - [x] Task 3.1: 创建 `AboutDialog.tsx` 组件，使用 `@radix-ui/react-dialog` 实现模态弹窗
  - [x] Task 3.2: 展示应用名称、Logo、版本号和简短描述

- [x] Task 4: 修改侧边栏组件绑定事件
  - [x] Task 4.1: 在 `Aside.tsx` 中引入 SearchDialog、SettingsDialog、AboutDialog 组件
  - [x] Task 4.2: 为搜索按钮绑定点击事件（打开搜索弹窗）
  - [x] Task 4.3: 为设置按钮绑定点击事件（打开设置弹窗）
  - [x] Task 4.4: 为关于按钮绑定点击事件（打开关于弹窗）

- [x] Task 5: 验证所有功能
  - [x] Task 5.1: 验证搜索弹窗点击和 ⌘K 快捷键可打开
  - [x] Task 5.2: 验证搜索过滤和跳转功能正常
  - [x] Task 5.3: 验证设置弹窗可打开并显示内容
  - [x] Task 5.4: 验证关于弹窗可打开并显示内容

# Task Dependencies
- Task 1、2、3 可以并行开发
- Task 4 依赖 Task 1、2、3（需要组件已创建才能引入）
- Task 5 依赖 Task 4（所有功能绑定后才能验证）
