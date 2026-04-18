# 修复 PDF 导出空白 + 文档模板库 Spec

## Why
PDF 导出功能产生空白文档，需要修复；同时用户需要预设文档模板库来快速创建结构化文档，避免从空白页开始。

## What Changes
- 修复 PDF 导出空白问题：将完整 HTML 文档通过 iframe 正确渲染后再导出
- 新增文档模板库功能：提供 4 类 14 个预设模板，支持一键创建
- 新增模板选择对话框组件
- 修改"新建文档"流程，增加"从模板创建"入口
- 复用 sessionStorage + replaceBlocks 内容注入模式

## Impact
- Affected code: `apps/web/src/utils/exportDocument.ts`（PDF 导出修复）
- Affected code: `apps/web/src/pages/Doc/index.tsx`（handleEditorReady 增加模板内容注入）
- Affected code: `apps/web/src/pages/DocList/index.tsx`（新增"从模板创建"入口）
- Affected code: `apps/web/src/components/LayoutAside/Aside.tsx`（新增"从模板创建"入口）
- New files: 模板数据定义、TemplateDialog 组件

## ADDED Requirements

### Requirement: PDF 导出修复
系统 SHALL 使用 iframe 方式渲染完整 HTML 文档后再调用 html2pdf.js 导出，确保 PDF 内容不为空白。

#### Scenario: PDF 导出成功
- **WHEN** 用户点击导出 PDF
- **THEN** 系统创建 iframe，通过 srcdoc 加载完整 HTML，等待渲染完成后调用 html2pdf 导出，PDF 内容完整显示

#### Scenario: iframe 加载失败
- **WHEN** iframe 加载超时或出错
- **THEN** 系统显示"导出失败，请稍后重试"toast 提示

### Requirement: 文档模板库
系统 SHALL 提供预设文档模板库，包含 4 个分类共 14 个模板，用户可一键选择模板创建文档。

#### Scenario: 打开模板选择对话框
- **WHEN** 用户点击"从模板创建"按钮
- **THEN** 弹出模板选择对话框，按分类展示模板卡片，每个卡片显示模板名称和适用场景简介

#### Scenario: 使用模板创建文档
- **WHEN** 用户点击某个模板卡片
- **THEN** 系统创建新文档，自动注入模板内容，进入编辑模式

#### Scenario: 模板搜索
- **WHEN** 用户在模板对话框搜索框输入关键词
- **THEN** 实时过滤匹配的模板（匹配名称和简介）

### Requirement: 模板分类与内容
系统 SHALL 提供以下模板分类和模板：

1. **通用办公**：周报、月报、会议纪要、工作日志
2. **产品/项目**：需求文档、项目方案、产品体验报告
3. **个人效率**：读书笔记、学习笔记、复盘
4. **简历类**：简历

每个模板包含完整的标题层级、占位内容（使用浅色或 `{请填写}` 标记），用户可一键替换。

### Requirement: 模板内容注入
系统 SHALL 复用 sessionStorage + editor.replaceBlocks 模式注入模板内容，与现有 Markdown 导入机制保持一致。

#### Scenario: 模板内容注入
- **WHEN** 用户选择模板并创建文档
- **THEN** 系统将模板 Markdown 内容存入 sessionStorage，创建页面后导航到编辑页，编辑器 ready 后通过 tryParseMarkdownToBlocks + replaceBlocks 注入内容
