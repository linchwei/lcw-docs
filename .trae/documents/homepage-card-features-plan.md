# 首页文档卡片功能修复计划

## 背景

首页文档卡片存在三个问题：
1. 三点菜单按钮无法点开（空壳，没有绑定 DropdownMenu）
2. 添加封面功能未在首页卡片中实现
3. 添加标签功能未在首页卡片中实现

## 调研发现

### 问题1：三点菜单空壳
- [DocList/index.tsx](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/pages/DocList/index.tsx) 第 146-155 行：`MoreVertical` 按钮仅做了 `stopPropagation` 和 `preventDefault`，没有绑定任何下拉菜单
- 侧边栏 [Aside.tsx](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/components/LayoutAside/Aside.tsx) 第 359-389 行已有完整的 DropdownMenu 实现可参考
- 删除 API 已存在：`services/page.ts` 中的 `removePage`、`permanentDeletePage`、`restorePage`

### 问题2：封面功能
- 服务端 `page.entity.ts` 已有 `coverImage` 字段
- 服务端 `page.service.ts` 的 `update` 方法已处理 `coverImage`
- **Bug**：`page.dto.ts` 的 `updatePageSchema` 缺少 `coverImage` 和 `folderId` 字段，导致 Zod 验证会剥离这些字段
- 文档详情页 [Doc/index.tsx](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/pages/Doc/index.tsx) 第 349-388 行已有封面显示/添加/移除功能
- 首页卡片没有显示封面图片

### 问题3：标签功能
- 后端 Tag API 完整（CRUD + 页面-标签关联）
- 前端 [PageTags/index.tsx](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/components/PageTags/index.tsx) 组件已在文档详情页使用
- 首页卡片没有标签显示
- 没有标签管理入口（侧边栏缺少标签管理）

---

## 修复步骤

### Step 1: 修复服务端 updatePageSchema（关键Bug）

**文件**：`apps/server/src/modules/page/page.dto.ts`

**当前代码**：
```typescript
export const updatePageSchema = z
    .object({
        pageId: z.string(),
        title: z.string().optional(),
        emoji: z.string().optional(),
    })
    .required({ pageId: true })
```

**修复后**：
```typescript
export const updatePageSchema = z
    .object({
        pageId: z.string(),
        title: z.string().optional(),
        emoji: z.string().optional(),
        coverImage: z.string().nullable().optional(),
        folderId: z.string().nullable().optional(),
    })
    .required({ pageId: true })
```

**原因**：`coverImage` 和 `folderId` 在 `page.service.ts` 的 `update` 方法中已处理，但 DTO 验证层缺少这两个字段，导致前端发送的 `coverImage` 被 ZodValidationPipe 剥离。

---

### Step 2: 首页卡片添加 DropdownMenu

**文件**：`apps/web/src/pages/DocList/index.tsx`

参考侧边栏 `Aside.tsx` 的 DropdownMenu 模式，为自有文档卡片和共享文档卡片的三点按钮添加下拉菜单。

**自有文档菜单项**：
- 收藏/取消收藏
- 新标签打开
- 添加封面
- 添加标签（内联选择器）
- 删除（移至回收站）

**共享文档菜单项**：
- 新标签打开
- 添加封面（仅编辑权限）

**实现要点**：
1. 导入 `DropdownMenu` 系列组件（来自 `@lcw-doc/shadcn-shared-ui`）
2. 导入所需图标（`Star`, `Trash2`, `ArrowUpRight`, `Image`, `Tag`）
3. 导入 `useQueryClient` 和 `useMutation` 用于数据操作
4. 添加 `handleDelete`、`handleToggleFavorite` 等处理函数
5. 将 `MoreVertical` 按钮包裹在 `DropdownMenuTrigger` 中
6. 注意：`DropdownMenuTrigger` 需要阻止事件冒泡，避免触发 Link 导航

---

### Step 3: 首页卡片显示封面图片

**文件**：`apps/web/src/pages/DocList/index.tsx` + `DocList.module.css`

在卡片中添加封面图片显示区域。

**实现要点**：
1. 在卡片的 emoji 区域上方添加封面图片区域
2. 如果有 `coverImage`，显示封面图片（替代 emoji 区域或在其上方）
3. 如果没有 `coverImage`，仅显示 emoji
4. 封面图片高度约 120px，使用 `object-cover` 填充
5. 添加对应的 CSS 样式

**卡片结构变化**：
```
┌─────────────────────┐
│ [封面图片 120px]     │  ← 新增（有 coverImage 时显示）
│ 📄 emoji            │  ← 无封面时显示
│ 文档标题             │
│ 3分钟前  [标签...]   │  ← 新增标签显示
│                [⋯]  │
└─────────────────────┘
```

---

### Step 4: 首页卡片显示标签

**文件**：`apps/web/src/pages/DocList/index.tsx`

在卡片中添加标签显示。

**实现要点**：
1. 使用 `useQuery` 获取每个页面的标签（`fetchPageTags`）
2. 在卡片标题下方显示标签（最多显示 2-3 个，超出显示 "+N"）
3. 标签样式参考 `PageTags` 组件的样式（小圆点 + 文字）
4. 考虑性能：批量获取标签或使用缓存策略

**标签显示样式**：
```tsx
{pageTags.slice(0, 2).map(tag => (
    <span
        key={tag.tagId}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px]"
        style={{ backgroundColor: tag.color + '18', color: tag.color }}
    >
        {tag.name}
    </span>
))}
{pageTags.length > 2 && (
    <span className="text-[10px] text-zinc-400">+{pageTags.length - 2}</span>
)}
```

---

### Step 5: 下拉菜单中添加"添加封面"功能

**文件**：`apps/web/src/pages/DocList/index.tsx`

在下拉菜单中添加"添加封面"选项，点击后弹出封面选择面板。

**实现要点**：
1. 添加 `coverPickerOpen` 状态和 `coverPickerPageId` 状态
2. 菜单项点击后打开封面选择面板
3. 封面选择面板：显示预设封面图片网格（复用 Doc/index.tsx 中的 Unsplash 图片列表）
4. 选择后调用 `updatePage({ pageId, coverImage: selectedUrl })`
5. 也提供"移除封面"选项（当已有封面时）

---

### Step 6: 下拉菜单中添加"添加标签"功能

**文件**：`apps/web/src/pages/DocList/index.tsx`

在下拉菜单中添加"添加标签"选项。

**实现要点**：
1. 菜单项点击后打开标签选择面板
2. 标签选择面板：显示所有可用标签（复用 `fetchTags` API）
3. 选择后调用 `addPageTag({ pageId, tagId })`
4. 也提供"创建新标签"入口（输入名称 + 选择颜色）
5. 创建后自动添加到当前页面

---

## 执行顺序

1. **Step 1** → 修复服务端 DTO（关键Bug，阻塞封面功能）
2. **Step 2** → 首页卡片添加 DropdownMenu（核心交互）
3. **Step 3** → 首页卡片显示封面图片
4. **Step 4** → 首页卡片显示标签
5. **Step 5** → 下拉菜单添加封面功能
6. **Step 6** → 下拉菜单添加标签功能
7. **验证** → 前端编译 + 服务端编译 + 功能测试
