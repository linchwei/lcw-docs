# 扩展单元测试覆盖 Spec

## Why
当前项目已有 13 个测试文件（209 个测试用例），但仍有大量核心模块缺少单元测试，特别是 api/nodeConversions（节点转换）、api/blockManipulation（块操作命令）、blocks 核心定义、extensions 功能模块等。需要扩展测试覆盖以确保代码质量。

## What Changes
- 为 api/nodeConversions 模块添加单元测试（blockToNode, nodeToBlock, fragmentToBlocks）
- 为 api/blockManipulation 命令添加单元测试
- 为 blocks 核心定义添加单元测试（defaultBlocks, defaultBlockHelpers, defaultBlockTypeGuards）
- 为 extensions/SuggestionMenu 添加单元测试（DefaultSuggestionItem, getDefaultSlashMenuItems, getDefaultEmojiPickerItems）
- 为 extensions/TrailingNode 添加单元测试
- 为 i18n 模块添加单元测试
- 为 api/getBlockInfoFromPos 添加单元测试
- 为 api/nodeUtil 添加单元测试

## Impact
- 新增测试文件到 packages/core/tests/ 目录
- 不修改任何源代码

## ADDED Requirements

### Requirement: 扩展单元测试覆盖
系统应为以下模块添加单元测试：

#### api/nodeConversions 模块
- blockToNode: 块转节点转换
- nodeToBlock: 节点转块转换
- fragmentToBlocks: 片段转块转换

#### api/blockManipulation 模块
- insertBlocks: 插入块
- removeBlocks: 删除块
- updateBlock: 更新块
- replaceBlocks: 替换块
- mergeBlocks: 合并块
- moveBlock: 移动块
- splitBlock: 分割块

#### blocks 核心定义
- defaultBlocks: 默认块定义验证
- defaultBlockHelpers: 块辅助函数
- defaultBlockTypeGuards: 块类型守卫

#### extensions 模块
- SuggestionMenu: 建议菜单项
- TrailingNode: 尾部节点扩展

#### 其他模块
- i18n: 国际化翻译
- getBlockInfoFromPos: 获取块信息
- nodeUtil: 节点工具函数

#### Scenario: 所有测试通过
- **WHEN** 运行 `pnpm run test`
- **THEN** 所有新增和已有测试通过
