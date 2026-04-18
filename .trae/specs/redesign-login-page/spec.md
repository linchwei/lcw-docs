# 重新设计登录页面 Spec

## Why
当前登录页面样式过于简单，缺乏视觉吸引力。用户希望拥有一个炫酷的登录页面，具有动画效果和交互体验，提升产品的专业感和用户体验。

## What Changes
- 重新设计登录页面 UI，采用现代化风格
- 添加开灯/关灯主题切换动画效果
- 实现密码可见性切换的"偷瞄"动画
- 优化整体视觉设计和交互体验

## Impact
- 影响文件：apps/web/src/pages/account/login.tsx
- 影响文件：apps/web/src/pages/account/login.module.css（新增）
- 影响文件：apps/web/src/components/LoginForm/（新增组件目录）

## ADDED Requirements

### Requirement: 主题切换动画
登录页面必须支持开灯/关灯主题切换，具有流畅的动画过渡效果。

#### Scenario: 主题切换
- **WHEN** 用户点击主题切换按钮
- **THEN** 页面背景、文字颜色、卡片样式平滑过渡到对应主题
- **AND** 切换过程有灯光开关的动画效果

### Requirement: 密码可见性动画
密码输入框必须具有"偷瞄"动画效果，当切换密码可见性时，有生动的交互反馈。

#### Scenario: 密码可见性切换
- **WHEN** 用户点击密码可见性切换按钮
- **THEN** 密码从隐藏（点号）变为可见（明文）或反之
- **AND** 切换按钮有眼睛"偷瞄"的动画效果
- **AND** 密码框获得焦点时有额外的视觉反馈

### Requirement: 现代化视觉设计
登录页面必须采用现代化的视觉设计风格，具有专业感和美观性。

#### Scenario: 页面加载
- **WHEN** 用户访问登录页面
- **THEN** 页面展示现代化的登录界面
- **AND** 包含流畅的入场动画
- **AND** 表单元素具有精致的视觉样式

## MODIFIED Requirements

### Requirement: 保持功能不变
**原则**：只更新 UI 设计和交互效果，不修改登录逻辑和功能。
