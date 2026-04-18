# 编写 Packages README 文档 Spec

## Why
项目包含多个 packages（core、react、shadcn、shadcn-shared-ui），每个包都有复杂的功能和架构。为了让团队成员快速了解每个包的核心代码结构、功能模块和使用方式，需要为每个 package 编写详细的 README.md 文档。

## What Changes
- 为 packages/core 编写详细 README.md，包含架构、API、扩展点等
- 为 packages/react 编写详细 README.md，包含组件、Hooks、集成方式等
- 为 packages/shadcn 编写详细 README.md，包含 UI 组件、主题、使用示例等
- 为 packages/shadcn-shared-ui 编写详细 README.md，包含基础 UI 组件库说明

## Impact
- 新增文件：packages/core/README.md
- 新增文件：packages/react/README.md
- 新增文件：packages/shadcn/README.md
- 新增文件：packages/shadcn-shared-ui/README.md

## ADDED Requirements

### Requirement: Core 包文档
Core 包文档必须包含：
- 架构概述（ProseMirror + Tiptap 基础）
- 核心概念（Block、InlineContent、Style）
- API 文档（编辑器实例、块操作、选择操作）
- 扩展系统（如何创建自定义块、样式、扩展）
- 核心模块说明（schema、pm-nodes、extensions 等）

### Requirement: React 包文档
React 包文档必须包含：
- 架构概述（React 组件与 Core 的集成）
- 主要组件说明（LcwDocView、EditorContent 等）
- Hooks 列表及使用说明
- UI 组件系统（工具栏、菜单、文件面板等）
- 与 Core 包的交互方式

### Requirement: Shadcn 包文档
Shadcn 包文档必须包含：
- 架构概述（基于 shadcn/ui 的 UI 实现）
- 组件映射关系（与 Core/React 包的对应关系）
- 主题系统（light/dark 模式）
- 各 UI 组件说明（Menu、Panel、SuggestionMenu 等）
- 使用示例

### Requirement: ShadcnSharedUI 包文档
ShadcnSharedUI 包文档必须包含：
- 基础 UI 组件库说明
- 组件列表（Button、Input、Dialog 等）
- 主题配置（Tailwind CSS v4 配置）
- 使用方式

## MODIFIED Requirements

### Requirement: 文档规范
所有 README 必须：
- 使用中文编写
- 包含目录结构
- 包含代码示例
- 包含关键文件链接
