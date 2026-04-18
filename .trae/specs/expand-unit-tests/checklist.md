# Checklist

## api/nodeConversions 测试
- [ ] nodeToBlock.test.ts 存在且测试通过
- [ ] fragmentToBlocks.test.ts 存在且测试通过
- [ ] blockToNode.test.ts 存在且测试通过

## api/blockManipulation 测试
- [ ] insertBlocks.test.ts 存在且测试通过
- [ ] removeBlocks.test.ts 存在且测试通过
- [ ] updateBlock.test.ts 存在且测试通过
- [ ] replaceBlocks.test.ts 存在且测试通过
- [ ] mergeBlocks.test.ts 存在且测试通过
- [ ] moveBlock.test.ts 存在且测试通过
- [ ] splitBlock.test.ts 存在且测试通过

## blocks 核心定义测试
- [ ] defaultBlocks.test.ts 存在且测试通过
- [ ] defaultBlockHelpers.test.ts 存在且测试通过
- [ ] defaultBlockTypeGuards.test.ts 存在且测试通过

## extensions 测试
- [ ] DefaultSuggestionItem.test.ts 存在且测试通过
- [ ] getDefaultSlashMenuItems.test.ts 存在且测试通过
- [ ] getDefaultEmojiPickerItems.test.ts 存在且测试通过
- [ ] TrailingNode.test.ts 存在且测试通过

## 其他模块测试
- [ ] dictionary.test.ts 存在且测试通过
- [ ] getBlockInfoFromPos.test.ts 存在且测试通过
- [ ] nodeUtil.test.ts 存在且测试通过

## 最终验证
- [ ] `pnpm run typecheck` 通过
- [ ] `pnpm run test` 全部通过
- [ ] `pnpm run build` 成功
