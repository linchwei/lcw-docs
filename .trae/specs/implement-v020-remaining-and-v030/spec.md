# v0.2.0 剩余功能 + v0.3.0 协作增强 Spec

## Why
v0.2.0 基础完善版本中仍有部分功能未实现（超链接、表格、图片增强、文字颜色、侧边栏折叠、编辑器空状态引导），同时 PRD 规划的 v0.3.0 协作增强（文档分享与权限）是下一个重要里程碑。需要补齐 v0.2.0 剩余功能并推进 v0.3.0 核心功能。

## What Changes
- 补齐 F-0204 编辑器功能：超链接、表格、图片增强、文字颜色
- 补齐 F-0205 UX 优化：侧边栏折叠、编辑器空状态引导
- 实现 F-0301 文档分享与权限：分享链接生成、访问权限、链接有效期、密码保护、访客模式、分享管理

## Impact
- Affected code: `packages/core/`（编辑器 schema 注册）, `packages/react/`（工具栏组件）, `apps/web/src/`（前端页面和组件）, `apps/server/src/`（后端 API 和实体）
- Affected systems: 编辑器功能、文档权限、用户认证（访客模式）

## ADDED Requirements

### Requirement: 超链接功能
系统 SHALL 在编辑器中支持超链接的创建、编辑、删除和点击跳转。

#### Scenario: 创建超链接
- **WHEN** 用户选中文字后按 Ctrl+K 或点击工具栏链接按钮
- **THEN** 弹出链接编辑框，输入 URL 后文字变为超链接

#### Scenario: 编辑超链接
- **WHEN** 用户点击已有超链接
- **THEN** 弹出链接工具栏，可编辑 URL 或删除链接

### Requirement: 表格功能
系统 SHALL 在编辑器中支持表格的创建和基本操作。

#### Scenario: 插入表格
- **WHEN** 用户通过斜杠菜单选择"表格"
- **THEN** 插入一个 3x3 的默认表格

#### Scenario: 表格操作
- **WHEN** 用户在表格中右键或使用表格工具栏
- **THEN** 可添加/删除行列

### Requirement: 图片增强
系统 SHALL 支持图片的拖拽上传和粘贴上传。

#### Scenario: 拖拽上传图片
- **WHEN** 用户将图片文件拖拽到编辑器中
- **THEN** 图片自动上传并插入到文档中

#### Scenario: 粘贴上传图片
- **WHEN** 用户从剪贴板粘贴图片
- **THEN** 图片自动上传并插入到文档中

### Requirement: 文字颜色
系统 SHALL 在格式工具栏中提供文字颜色和背景色选择器。

#### Scenario: 设置文字颜色
- **WHEN** 用户选中文字后点击颜色按钮选择颜色
- **THEN** 选中文字应用所选颜色

### Requirement: 侧边栏折叠
系统 SHALL 支持侧边栏折叠/展开，折叠时仅显示图标。

#### Scenario: 折叠侧边栏
- **WHEN** 用户点击侧边栏折叠按钮
- **THEN** 侧边栏折叠为仅图标模式，状态持久化到 localStorage

### Requirement: 编辑器空状态引导
系统 SHALL 在新文档编辑器区域显示引导提示。

#### Scenario: 新文档引导
- **WHEN** 用户创建新文档，编辑器内容为空
- **THEN** 显示引导文字"输入 / 插入块，输入 @ 引用文档"

### Requirement: 文档分享与权限
系统 SHALL 支持文档分享功能，包括链接生成、权限控制、有效期和密码保护。

#### Scenario: 生成分享链接
- **WHEN** 文档所有者点击分享按钮并创建分享
- **THEN** 生成唯一分享链接，可复制分享给他人

#### Scenario: 访客查看文档
- **WHEN** 未登录用户通过分享链接访问文档
- **THEN** 根据权限设置，访客可查看/评论/编辑文档

#### Scenario: 链接过期
- **WHEN** 分享链接已超过有效期
- **THEN** 访客无法访问，提示链接已过期

#### Scenario: 密码保护
- **WHEN** 分享链接设置了密码
- **THEN** 访客需输入密码才能访问

#### Scenario: 撤销分享
- **WHEN** 文档所有者撤销分享链接
- **THEN** 该链接失效，访客无法访问

## MODIFIED Requirements

### Requirement: SharePopover 组件
将现有的静态 SharePopover 改为功能完整的分享弹窗，集成分享链接生成、权限设置、有效期和密码保护功能。
