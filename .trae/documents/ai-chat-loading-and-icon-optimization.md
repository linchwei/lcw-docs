# AI 聊天 Loading + 图标优化计划

## 需求分析

### 1. AI 聊天框请求中添加 Loading 效果
**当前状态**：AI 请求发出后，在流式内容返回之前（网络延迟期间），聊天区域没有任何视觉反馈，用户不知道请求是否在进行中。只有当第一个 token 到达后，才会显示流式文本 + 闪烁光标。

**目标效果**：类似 ChatGPT 等聊天应用，在请求发出后、流式内容返回前，显示一个 "思考中" 的 loading 动画（三个跳动的圆点），让用户知道 AI 正在处理。

**修改文件**：`apps/web/src/components/GlobalAIChat/index.tsx`

**实现方案**：
- 在 `streamContent` 为空且 `isGenerating` 为 true 时，显示一个 AI 消息气泡，内含三个跳动的圆点（CSS 动画实现）
- 在已有的 `useEffect` 注入样式中添加 `@keyframes globalAiDotBounce` 动画
- 流式内容到达后，跳动圆点自动被流式文本 + 闪烁光标替换

### 2. 左上角 "协同文档" Logo 换成纯 CSS 图标
**当前状态**：使用 `<img src="/logo.png">` 加载外部图片文件。

**目标效果**：替换为纯 CSS 实现的图标，无需外部图片依赖。

**修改文件**：`apps/web/src/components/LayoutAside/Aside.tsx`（第 146 行）

**实现方案**：
- 用纯 CSS 创建一个文档/协作风格的图标（如：两个重叠的圆角矩形 + 连接线，象征协作）
- 尺寸保持 `w-7 h-7`（28x28px），圆角 `rounded-md`
- 颜色与当前主题协调

### 3. 左下角用户头像换成纯 CSS 图标
**当前状态**：使用 `<Avatar>` 组件 + `robohash.org` 外部图片。

**目标效果**：替换为纯 CSS 实现的用户图标（如：圆形头像轮廓 + 用户名首字母）。

**修改文件**：`apps/web/src/components/LayoutAside/Aside.tsx`（第 357-360 行）

**实现方案**：
- 用纯 CSS 创建圆形背景 + 用户名首字母的图标
- 颜色基于用户名 hash 生成，保持视觉区分度
- 尺寸保持 `h-7 w-7`
- 移除 `<Avatar>`、`<AvatarImage>`、`<AvatarFallback>` 组件的使用

### 4. 移除标题前的 emoji 图标
**当前状态**：编辑器页面标题前显示 `{page?.emoji}`，出现在两个位置：
- 面包屑导航（第 182 行）`<em className="mr-2">{page?.emoji}</em>`
- 编辑区大标题（第 263-265 行）`<span ...>{page?.emoji}</span>`

**目标效果**：移除标题前的 emoji 图标。

**修改文件**：`apps/web/src/pages/Doc/index.tsx`

**实现方案**：
- 面包屑导航：移除 `<em className="mr-2">{page?.emoji}</em>`
- 编辑区大标题：移除 `<span className="text-[40px] mr-3 hover:bg-[#ebebea] p-1 -ml-1 transition-colors cursor-pointer rounded-md">{page?.emoji}</span>`

## 实施步骤

### Step 1: AI 聊天框添加 Loading 动画
- 文件：`apps/web/src/components/GlobalAIChat/index.tsx`
- 在 `useEffect` 中添加 `@keyframes globalAiDotBounce` 动画
- 在消息列表和流式内容之间，添加 loading 状态渲染逻辑：
  - 条件：`isGenerating && !streamContent`
  - 显示：AI 消息气泡 + 三个跳动圆点

### Step 2: 替换左上角 Logo 为纯 CSS 图标
- 文件：`apps/web/src/components/LayoutAside/Aside.tsx`
- 将 `<img className="w-7 h-7 rounded-md" src="/logo.png" />` 替换为纯 CSS 实现的图标

### Step 3: 替换左下角用户头像为纯 CSS 图标
- 文件：`apps/web/src/components/LayoutAside/Aside.tsx`
- 将 `<Avatar>` + `<AvatarImage>` + `<AvatarFallback>` 替换为纯 CSS 实现的圆形首字母图标

### Step 4: 移除标题前的 emoji 图标
- 文件：`apps/web/src/pages/Doc/index.tsx`
- 移除面包屑中的 `<em className="mr-2">{page?.emoji}</em>`
- 移除大标题中的 `<span ...>{page?.emoji}</span>`

### Step 5: 验证功能
- 启动开发服务器
- 验证 AI 聊天 loading 动画效果
- 验证左上角 CSS 图标显示
- 验证左下角用户 CSS 图标显示
- 验证标题前无 emoji

### Step 6: 代码自检
- 运行 typecheck 确保无类型错误
