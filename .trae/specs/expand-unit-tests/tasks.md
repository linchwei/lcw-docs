# Tasks

## Task 1: api/nodeConversions 单元测试
- [ ] Task 1.1: 为 nodeToBlock.ts 编写单元测试
  - 测试节点转块的基本转换
  - 测试带属性的节点转换
  - 测试嵌套块转换
- [ ] Task 1.2: 为 fragmentToBlocks.ts 编写单元测试
  - 测试 Fragment 转块数组
  - 测试空 Fragment 处理
- [ ] Task 1.3: 为 blockToNode.ts 编写单元测试
  - 测试块转节点的基本转换
  - 测试带样式的块转换

## Task 2: api/blockManipulation 单元测试
- [ ] Task 2.1: 为 insertBlocks 编写单元测试
- [ ] Task 2.2: 为 removeBlocks 编写单元测试
- [ ] Task 2.3: 为 updateBlock 编写单元测试
- [ ] Task 2.4: 为 replaceBlocks 编写单元测试
- [ ] Task 2.5: 为 mergeBlocks 编写单元测试
- [ ] Task 2.6: 为 moveBlock 编写单元测试
- [ ] Task 2.7: 为 splitBlock 编写单元测试

## Task 3: blocks 核心定义单元测试
- [ ] Task 3.1: 为 defaultBlocks.ts 编写单元测试
  - 测试默认块定义导出
  - 测试块类型守卫
- [ ] Task 3.2: 为 defaultBlockHelpers.ts 编写单元测试
  - 测试 DOM/HTML 转换辅助函数
- [ ] Task 3.3: 为 defaultBlockTypeGuards.ts 编写单元测试
  - 测试类型守卫函数

## Task 4: extensions 单元测试
- [ ] Task 4.1: 为 SuggestionMenu/DefaultSuggestionItem.ts 编写单元测试
  - 测试建议项结构
- [ ] Task 4.2: 为 SuggestionMenu/getDefaultSlashMenuItems.ts 编写单元测试
  - 测试斜杠菜单项
- [ ] Task 4.3: 为 SuggestionMenu/getDefaultEmojiPickerItems.ts 编写单元测试
  - 测试表情选择器项
- [ ] Task 4.4: 为 TrailingNode/TrailingNodeExtension.ts 编写单元测试
  - 测试尾部节点扩展配置

## Task 5: 其他模块单元测试
- [ ] Task 5.1: 为 i18n/dictionary.ts 编写单元测试
  - 测试翻译字典
- [ ] Task 5.2: 为 api/getBlockInfoFromPos.ts 编写单元测试
  - 测试获取块信息函数
- [ ] Task 5.3: 为 api/nodeUtil.ts 编写单元测试
  - 测试节点工具函数

## Task 6: 验证
- [ ] Task 6.1: 运行类型检查确保无错误
- [ ] Task 6.2: 运行所有测试确保通过
- [ ] Task 6.3: 运行构建确保成功

# Task Dependencies
- Task 1-5 可以并行执行
- Task 6 依赖 Task 1-5 完成
