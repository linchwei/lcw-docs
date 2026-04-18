# 文档图谱功能完善计划

## 问题分析

经过对 DocGraph 相关代码的全面审查，发现以下问题：

### Bug 类问题

1. **加载指示器永远不消失** — `simulationTickEnd.current` 是一个 ref，修改 ref 不会触发 React 重渲染。初始值 `false` 导致加载遮罩一直显示，`simulation.on('end')` 中设置 `simulationTickEnd.current = true` 后无法触发重渲染来移除遮罩
2. **console.log 残留** — 第 34 行 `console.log('🚀 ~ DocGraph ~ pages:', pages)` 未清理
3. **服务端 graph() 未过滤已删除页面** — `this.pageRepository.find()` 没有加 `isDeleted: false` 条件，已删除的文档也会出现在图谱中
4. **服务端 graph() 未过滤用户** — 没有按 userId 过滤，所有用户的文档都会返回（安全隐患）

### 功能缺失

5. **无法从图谱导航到文档** — 点击节点只选中高亮，无法跳转到对应文档
6. **无空状态提示** — 当没有文档或没有关联关系时，页面只显示空白图谱
7. **仅展示 @mention 关系** — 图谱只显示通过 @提及 建立的关系，缺少其他关系类型（如文档嵌套/子页面关系）
8. **无边标签** — 连线不显示关系类型说明
9. **无小地图** — 文档较多时缺少全局导航能力

### 体验优化

10. **连线使用直线** — `getStraightPath` 使图谱看起来生硬，应改为贝塞尔曲线
11. **节点颜色随机** — 每次渲染颜色随机分配，应基于文档属性（如 emoji 类型）稳定分配
12. **旧版文件残留** — `indexV1.tsx` 是废弃代码，应清理

---

## 实施步骤

### 第一步：修复 Bug

**文件：`apps/web/src/pages/DocGraph/index.tsx`**

- 移除 `simulationTickEnd` ref，改用 `useState` 管理加载状态
- 在 d3-force simulation tick 过程中设置 `loading = true`，在 `simulation.on('end')` 中设置 `loading = false`
- 移除第 34 行的 `console.log`
- 移除第 93 行的 `console.log('simulation end')`

**文件：`apps/server/src/modules/page/page.service.ts`**

- `graph()` 方法增加 `isDeleted: false` 过滤条件
- `graph()` 方法增加 `userId` 参数，按用户过滤页面

**文件：`apps/server/src/modules/page/page.controller.ts`**

- `graph()` 方法从 `req.user.id` 获取 userId 传递给 service

### 第二步：添加导航功能

**文件：`apps/web/src/pages/DocGraph/index.tsx`**

- 引入 `useNavigate` from `react-router-dom`
- 修改 `handleNodeClick`：双击节点时导航到 `/doc/${node.id}`
- 添加 `onNodeDoubleClick` 处理器
- 在节点 tooltip 或右键菜单中添加"打开文档"选项

**文件：`apps/web/src/pages/DocGraph/Node.tsx`**

- 添加 cursor-pointer 样式暗示可点击
- 添加 title 属性显示文档标题（原生 tooltip）

### 第三步：添加空状态和统计信息

**文件：`apps/web/src/pages/DocGraph/index.tsx`**

- 当 pages 为空数组时，显示空状态插图和提示文字"暂无文档，创建文档并使用 @提及 来建立关联"
- 当有文档但 edges 为空时，显示提示"暂无文档关联，在文档中使用 @提及 其他文档来建立关联"
- 在页面头部添加统计信息：文档总数、关联数

### 第四步：优化视觉体验

**文件：`apps/web/src/pages/DocGraph/Edge.tsx`**

- 将 `getStraightPath` 替换为 `getBezierPath`，使连线更流畅
- 优化连线样式：未选中时使用浅灰虚线，选中时使用蓝色实线，增加线宽

**文件：`apps/web/src/pages/DocGraph/Node.tsx`**

- 改进颜色分配策略：基于 emoji 的 charCode 稳定分配颜色，而非随机
- 优化节点布局：调整 emoji 圆形和标题的间距
- 添加 hover 效果：鼠标悬停时轻微放大和阴影

**文件：`apps/web/src/pages/DocGraph/index.tsx`**

- 添加 ReactFlow `MiniMap` 组件
- 优化 d3-force 参数：调整力导向参数使布局更合理
- 添加 `fitView` 选项使图谱自动适配视口

### 第五步：清理废弃代码

- 删除 `apps/web/src/pages/DocGraph/indexV1.tsx`

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `apps/web/src/pages/DocGraph/index.tsx` | 修改 |
| `apps/web/src/pages/DocGraph/Node.tsx` | 修改 |
| `apps/web/src/pages/DocGraph/Edge.tsx` | 修改 |
| `apps/server/src/modules/page/page.service.ts` | 修改 |
| `apps/server/src/modules/page/page.controller.ts` | 修改 |
| `apps/web/src/pages/DocGraph/indexV1.tsx` | 删除 |
