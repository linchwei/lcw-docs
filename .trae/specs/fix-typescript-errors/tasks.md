# Tasks

## Phase 1: TypeScript 错误修复（共 4 个文件，7 处错误）- ✅ 已完成

### Task 1.1: 修复 TableBlockContent.ts 的 addNodeView 返回类型问题 - ✅
### Task 1.2: 修复 LcwDocEditor.ts 的 CSS 导入和变量引用问题 - ✅
### Task 1.3: 修复 LcwDocExtensions.ts 的类型赋值错误 - ✅
### Task 1.4: 修复 UniqueID.ts 的类型推断问题 - ✅

## Phase 2: 添加中文注释

### Task 2.1: 检查现有文件注释情况 - ✅ 已完成

### Task 2.2: editor 目录 - ✅ 已完成
- LcwDocEditor.ts - ✅
- LcwDocExtensions.ts - ✅
- LcwDocTipTapEditor.ts - ✅
- LcwDocSchema.ts - ✅
- cursorPositionTypes.ts - ✅
- selectionTypes.ts - ✅
- transformPasted.ts - ✅

### Task 2.3: extensions 目录 - ✅ 已完成
- UniqueID.ts - ✅
- TrailingNode.ts - ✅
- TextColorExtension.ts / TextColorMark.ts - ✅
- TextAlignmentExtension.ts - ✅
- TableHandlesPlugin.ts - ✅
- SideMenuPlugin.ts - ✅
- SuggestionPlugin.ts - ✅
- 其他扩展文件 - ✅

### Task 2.4: blocks 目录 - ✅ 已完成
- TableBlockContent.ts - ✅
- defaultBlocks.ts - ✅
- defaultBlockHelpers.ts - ✅
- 其他块定义文件 - ✅

### Task 2.5: api 目录 - ✅ 已完成
- blockManipulation 目录 - ✅
- nodeConversions 目录 - ✅
- parsers 和 exporters 目录 - ✅

### Task 2.6: pm-nodes 目录 - ⏳ 待完成
- [ ] Doc.ts - 文档节点定义
- [ ] BlockContainer.ts - 块容器节点定义
- [ ] BlockGroup.ts - 块组节点定义
- [ ] index.ts - 导出文件

### Task 2.7: schema 目录 - ⏳ 待完成
- [ ] blocks/types.ts - 块类型定义
- [ ] blocks/createSpec.ts - 块规范创建
- [ ] blocks/internal.ts - 块内部类型
- [ ] inlineContent/types.ts - 内联内容类型定义
- [ ] inlineContent/createSpec.ts - 内联内容规范创建
- [ ] inlineContent/internal.ts - 内联内容内部类型
- [ ] styles/types.ts - 样式类型定义
- [ ] styles/createSpec.ts - 样式规范创建
- [ ] styles/internal.ts - 样式内部类型
- [ ] propTypes.ts - 属性类型定义
- [ ] index.ts - 导出文件

### Task 2.8: util 目录 - ⏳ 待完成
- [ ] browser.ts - 浏览器工具函数
- [ ] EventEmitter.ts - 事件发射器
- [ ] typescript.ts - TypeScript 工具类型
- [ ] string.ts - 字符串工具函数
- [ ] esmDependencies.ts - ESM 依赖处理

## Phase 3: 添加单元测试

### Task 3.1: 测试框架配置 - ✅ 已完成
- vitest.config.ts - ✅
- package.json 测试脚本 - ✅

### Task 3.2: UniqueID 扩展测试 - ✅ 已完成
- tests/extensions/UniqueID.test.ts - ✅

### Task 3.3: TableBlockContent 测试 - ✅ 已完成
- tests/blocks/TableBlockContent.test.ts - ✅

### Task 3.4: LcwDocExtensions 测试 - ✅ 已完成
- tests/editor/LcwDocExtensions.test.ts - ✅

### Task 3.5: LcwDocEditor 测试 - ⏳ 待完成
- [ ] 测试 create 方法
- [ ] 测试 block 操作方法 (insertBlocks, removeBlocks, updateBlock, replaceBlocks)
- [ ] 测试样式操作方法 (getActiveStyles, addStyles, removeStyles, toggleStyles)

### Task 3.6: pm-nodes 模块测试 - ⏳ 待完成
- [ ] Doc 节点测试
- [ ] BlockContainer 节点测试
- [ ] BlockGroup 节点测试

### Task 3.7: schema 模块测试 - ⏳ 待完成
- [ ] createSpec 函数测试
- [ ] 类型定义测试

### Task 3.8: util 模块测试 - ⏳ 待完成
- [ ] browser 工具函数测试
- [ ] EventEmitter 测试
- [ ] typescript 工具类型测试
- [ ] string 工具函数测试

## Phase 4: 验证 - ⏳ 待完成

### Task 4.1: 运行完整类型检查
- [ ] 执行 `pnpm run typecheck`
- [ ] 确认无任何 TypeScript 错误

### Task 4.2: 运行单元测试
- [ ] 执行 `pnpm run test`
- [ ] 确认所有测试通过

### Task 4.3: 运行构建
- [ ] 执行 `pnpm run build`
- [ ] 确认构建成功

# Task Dependencies
- Task 2.6-2.8 依赖 Phase 1 完成
- Task 3.5-3.8 依赖 Phase 1 完成
- Task 4 依赖 Task 2.6-2.8 和 Task 3.5-3.8 完成
