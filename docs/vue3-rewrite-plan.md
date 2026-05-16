# LCW-Docs Vue 3 迁移实施方案

## 概述

现有 React 版本保持不动，**平行新增** Vue 3 版本。两者共享 `packages/core`（编辑器引擎）和 `apps/server`（NestJS 后端），互不干扰。

```
现有（不动）        新增
packages/core  ──  packages/core（共享）
packages/react     packages/vue
apps/web           apps/web-vue
apps/server  ────  apps/server（共享）
```

## 技术栈对照

| React 栈（不变） | Vue 3 替换方案 |
|-----------------|---------------|
| React 19 + ReactDOM | Vue 3 + vue |
| react-router-dom v7 | vue-router 4 |
| @tanstack/react-query | @tanstack/vue-query |
| zustand / React Context | Pinia |
| shadcn/ui + Radix UI | **Naive UI** |
| lucide-react | lucide-vue-next 或 @vicons/ionicons5 |
| react-hook-form | Naive UI NForm |
| sonner | Naive UI useMessage / useNotification |
| @tiptap/react | @tiptap/vue-3 |
| @xyflow/react | @vue-flow/core |
| 其余框架无关库 | 直接复用（axios, yjs, d3-force, date-fns 等） |

## 一、Monorepo 结构（平行共存）

```
lcw-docs/
├── packages/
│   ├── core/           # 共享 — 纯 TS 编辑器引擎（不动）
│   ├── react/          # 保留 — React 绑定库（不动）
│   └── vue/            # NEW — Vue 3 绑定库
├── apps/
│   ├── server/         # 共享 — NestJS 后端（不动）
│   ├── web/            # 保留 — React 前端（不动）
│   └── web-vue/        # NEW — Vue 3 前端
└── ...
```

**核心规则：**
- `packages/core` + `apps/server` — 共享，零改动
- `apps/web-vue` 中纯 TS 文件（`services/`, `utils/`, `types/`）直接复制自 `apps/web`，不改逻辑
- 两边独立构建、独立启动
- 开发时 `pnpm dev` 启动 `apps/web`（React），`pnpm dev:vue` 启动 `apps/web-vue`

## 二、工程化配置

### 2.1 工作空间

`pnpm-workspace.yaml` 只加 `apps/web-vue`，不动现有：

```yaml
packages:
    - 'packages/*'
    - 'apps/*'
```

### 2.2 共享：packages/core

**零改动**。`packages/core` 没有 React 依赖（纯 TS + Prosemirror + Tiptap core + Yjs），Vue 3 直接引用。

### 2.3 新增：apps/web-vue/vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        port: 5174,               // 与 React 版 dev server 不同端口
        proxy: { '/api': { target: 'http://localhost:8082', changeOrigin: true } },
    },
})
```

### 2.4 新增：packages/vue/tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    external: ['vue', '@tiptap/core', '@tiptap/vue-3', '@tiptap/pm'],
    splitting: true,
    sourcemap: true,
    clean: true,
})
```

### 2.5 新增：apps/web-vue/package.json 示例

```json
{
  "name": "@lcw-doc/web-vue",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@lcw-doc/vue": "workspace:*",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0",
    "pinia": "^3.0.0",
    "naive-ui": "^2.40.0",
    "@tanstack/vue-query": "^5.0.0",
    "@vue-flow/core": "^1.0.0",
    "@tiptap/vue-3": "^2.27.2",
    "lucide-vue-next": "^0.523.0",
    "axios": "^1.8.4",
    "yjs": "^13.6.24",
    "y-indexeddb": "^9.0.12",
    "y-websocket": "^2.1.0",
    "canvas-confetti": "^1.9.3",
    "d3-force": "^3.0.0",
    "date-fns": "^4.1.0",
    "docx": "^9.6.1",
    "file-saver": "^2.0.5",
    "pubsub-js": "^1.9.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@tailwindcss/vite": "^4.1.4",
    "vite": "^6.3.2",
    "vue-tsc": "^2.0.0",
    "typescript": "^6.0.0",
    "tailwindcss": "^4.1.4",
    "vitest": "^4.1.4",
    "jsdom": "^29.0.2"
  }
}
```

## 三、packages/vue 包设计（核心工作）

### 3.1 目录结构

```
packages/vue/src/
├── index.ts                                 # 包入口
├── style.css                                # 全局样式
│
├── editor/
│   ├── inject.ts                            # provide/inject 键
│   ├── EditorContent.vue                    # 编辑器内容（mount 点）
│   ├── ElementRenderer.vue                  # 块元素递归渲染
│   ├── LcwDocContext.ts                     # 上下文类型
│   ├── LcwDocDefaultUI.vue                  # 默认 UI 插槽容器
│   └── LcwDocView.vue                       # 编辑器视图核心
│
├── blocks/
│   ├── AudioBlockContent.vue                # 音频块
│   ├── FileBlockContent.vue                 # 文件块
│   ├── ImageBlockContent.vue                # 图片块
│   └── VideoBlockContent.vue                # 视频块
│
├── components/
│   ├── ColorPicker/
│   │   ├── ColorIcon.vue
│   │   └── ColorPicker.vue
│   ├── FilePanel/
│   │   ├── FilePanel.vue
│   │   ├── FilePanelController.vue
│   │   └── DefaultTabs/EmbedTab.vue, UploadTab.vue
│   ├── FormattingToolbar/
│   │   ├── FormattingToolbar.vue
│   │   ├── FormattingToolbarController.vue
│   │   ├── DefaultButtons/ (11 个按钮)
│   │   └── DefaultSelects/BlockTypeSelect.vue
│   ├── LinkToolbar/
│   │   ├── LinkToolbar.vue
│   │   ├── LinkToolbarController.vue
│   │   └── EditLinkMenuItems.vue
│   ├── SideMenu/
│   │   ├── SideMenu.vue
│   │   ├── SideMenuController.vue
│   │   ├── DefaultButtons/
│   │   └── DragHandleMenu/
│   ├── SuggestionMenu/
│   │   ├── SuggestionMenuController.vue
│   │   ├── SuggestionMenuWrapper.vue
│   │   ├── GridSuggestionMenu/
│   │   ├── hooks/
│   │   └── getDefaultVueSlashMenuItems.ts
│   └── TableHandles/
│       ├── TableHandle.vue
│       ├── TableHandlesController.vue
│       ├── ExtendButton/
│       └── TableHandleMenu/
│
├── composables/                             # 替换 React hooks
│   ├── useActiveStyles.ts
│   ├── useCreateLcwDoc.ts
│   ├── useEditorChange.ts
│   ├── useEditorContentOrSelectionChange.ts
│   ├── useEditorForceUpdate.ts
│   ├── useEditorSelectionChange.ts
│   ├── usePrefersColorScheme.ts
│   ├── useSelectedBlocks.ts
│   ├── useUIElementPositioning.ts
│   └── useUIPluginState.ts
│
├── i18n/
│   └── dictionary.ts
│
├── schema/
│   ├── VueBlockSpec.ts
│   ├── VueInlineContentSpec.ts
│   ├── VueStyleSpec.ts
│   └── VueRenderUtil.ts
│
└── util/
    ├── elementOverflow.ts
    ├── mergeRefs.ts
    └── sanitizeUrl.ts
```

### 3.2 LcwDocView.vue（核心组件）

```vue
<script setup lang="ts">
import { provide, computed } from 'vue'
import type { LcwDocEditor } from '@lcw-doc/core'
import { EditorContent } from './EditorContent.vue'
import { ElementRenderer } from './ElementRenderer.vue'
import { LcwDocDefaultUI } from './LcwDocDefaultUI.vue'
import { usePrefersColorScheme } from '../composables/usePrefersColorScheme'

const props = withDefaults(defineProps<{
  editor: LcwDocEditor<any, any, any>
  theme?: 'light' | 'dark'
  editable?: boolean
}>(), {})

const prefersColorScheme = usePrefersColorScheme()
const editorColorScheme = computed(() => props.theme || prefersColorScheme.value)

provide('lcwDocEditor', props.editor)
</script>

<template>
  <div :class="['bn-container', editorColorScheme]" :data-color-scheme="editorColorScheme">
    <ElementRenderer />
    <EditorContent :editor="editor">
      <div ref="editorMount" aria-autocomplete="list" />
      <LcwDocDefaultUI>
        <slot />
      </LcwDocDefaultUI>
    </EditorContent>
  </div>
</template>
```

### 3.3 provide/inject 模式

```typescript
// editor/inject.ts
import { inject, provide, type InjectionKey } from 'vue'
import type { LcwDocEditor } from '@lcw-doc/core'

const EDITOR_KEY: InjectionKey<LcwDocEditor<any, any, any>> = Symbol('lcwDocEditor')

export function provideLcwDocEditor(editor: LcwDocEditor<any, any, any>) {
  provide(EDITOR_KEY, editor)
}

export function useLcwDocEditor(): LcwDocEditor<any, any, any> {
  return inject(EDITOR_KEY)!
}
```

### 3.4 Composables 对照

| React hook (packages/react) | Vue composable (packages/vue) | 迁移方式 |
|---------------------------|------------------------------|---------|
| `useCreateLcwDoc.tsx` | `useCreateLcwDoc.ts` | `useMemo` → 直接返回实例 |
| `useLcwDocEditor.ts` | 合并入 `inject.ts` | `useContext` → `inject` |
| `useActiveStyles.ts` | `useActiveStyles.ts` | `useState` → `ref`，`useEffect` → `watch` |
| `useEditorChange.ts` | `useEditorChange.ts` | 事件订阅：`onMounted`/`onUnmounted` |
| `useEditorContentOrSelectionChange.ts` | 同名 | 同上 |
| `useEditorForceUpdate.tsx` | `useEditorForceUpdate.ts` | 移除 React 特定模式 |
| `useEditorSelectionChange.ts` | 同名 | `onMounted`/`onUnmounted` |
| `usePrefersColorScheme.ts` | 同名 | `window.matchMedia` 监听 |
| `useSelectedBlocks.ts` | 同名 | `useState` → `ref` |
| `useUIElementPositioning.ts` | 同名 | 逻辑不变（无框架依赖） |
| `useUIPluginState.ts` | 同名 | 同上 |

### 3.5 Schema 适配层

React 版有 `ReactBlockSpec.tsx` / `ReactInlineContentSpec.tsx` / `ReactStyleSpec.tsx`，直接翻译为 Vue 版：

| React 文件 | Vue 文件 | 说明 |
|-----------|---------|------|
| `ReactBlockSpec.tsx` | `VueBlockSpec.ts` | 返回块配置，注册 Vue 组件 |
| `ReactInlineContentSpec.tsx` | `VueInlineContentSpec.ts` | 同上 |
| `ReactStyleSpec.tsx` | `VueStyleSpec.ts` | 同上 |
| `ReactRenderUtil.ts` | `VueRenderUtil.ts` | 使用 `h()` 渲染函数 |

### 3.6 i18n

```typescript
// i18n/dictionary.ts
import { inject, provide, type InjectionKey } from 'vue'
import { defaultDictionary, type PartialDictionary, type Dictionary } from '@lcw-doc/core'

const DICT_KEY: InjectionKey<Dictionary> = Symbol('lcwDocDictionary')

export function provideDictionary(dict?: PartialDictionary) {
  provide(DICT_KEY, { ...defaultDictionary, ...dict } as Dictionary)
}

export function useDictionary(): Dictionary {
  return inject(DICT_KEY, defaultDictionary as Dictionary)
}
```

### 3.7 packages/vue 依赖

```json
{
  "name": "@lcw-doc/vue",
  "dependencies": {
    "@tiptap/core": "^2.27.2",
    "@tiptap/vue-3": "^2.27.2",
    "@tiptap/pm": "^2.27.2"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

## 四、apps/web-vue 前端架构

### 4.1 入口 main.ts

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App)
app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)
app.mount('#app')
```

### 4.2 App.vue

```vue
<script setup lang="ts">
import { NConfigProvider, NNotificationProvider, NMessageProvider, zhCN, dateZhCN } from 'naive-ui'
import { useThemeStore } from './stores/theme'
import { setDefaultOptions } from 'date-fns'
import { zhCN as fnsZhCN } from 'date-fns/locale'

setDefaultOptions({ locale: fnsZhCN })

const themeStore = useThemeStore()
themeStore.applyInitialTheme()
</script>

<template>
  <NConfigProvider :theme="themeStore.naiveTheme" :locale="zhCN" :date-locale="dateZhCN">
    <NNotificationProvider>
      <NMessageProvider>
        <RouterView />
      </NMessageProvider>
    </NNotificationProvider>
  </NConfigProvider>
</template>
```

### 4.3 路由设计

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/account/login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/doc' },
        { path: 'doc', component: () => import('@/views/DocList/index.vue') },
        { path: 'doc/:id', component: () => import('@/views/DocEditor/index.vue') },
        { path: 'doc/graph', component: () => import('@/views/DocGraph/index.vue') },
      ],
    },
    {
      path: '/share/:shareId',
      component: () => import('@/views/Share/index.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('lcwdoc-token')
  if (to.meta.requiresAuth && !token) return '/account/login'
})

export default router
```

### 4.4 Naive UI 集成

```bash
pnpm --filter @lcw-doc/web-vue add naive-ui
```

Naive UI 全组件按需 tree-shaking，一个包覆盖全部场景。

### 4.5 完整目录结构

```
apps/web-vue/src/
├── main.ts                     # 入口
├── App.vue                     # 根组件（NConfigProvider）
├── index.css                   # Tailwind + 全局样式
├── editor-styles.css           # 编辑器样式
│
├── router/
│   └── index.ts                # vue-router 配置
│
├── stores/                     # Pinia 状态管理
│   ├── auth.ts                 # 认证状态
│   ├── theme.ts                # 主题状态（Naive UI darkTheme）
│   └── editor.ts               # 编辑器相关状态
│
├── composables/                # 通用组合函数
│   ├── useClickOutside.ts
│   └── useWordCount.ts
│
├── layout/
│   └── index.vue               # 应用布局（NLayout + NMenu + NLayoutSider）
│
├── views/
│   ├── Login.vue               # 登录/注册页（NForm 校验）
│   ├── DocEditor/
│   │   ├── index.vue           # 编辑器页面
│   │   ├── DocOutline.vue      # 文档大纲
│   │   ├── AvatarList.vue      # 协作者头像
│   │   └── cursorRender.ts     # 光标渲染（纯 TS，复制自 apps/web）
│   ├── DocList/
│   │   └── index.vue           # 文档列表（NEmpty 空状态）
│   ├── DocGraph/
│   │   ├── index.vue           # @vue-flow/core 图谱
│   │   ├── Node.vue            # 自定义节点
│   │   └── Edge.vue            # 自定义边
│   └── Share/
│       └── index.vue           # 分享页（只读编辑器）
│
├── components/
│   ├── BacklinksPanel.vue
│   ├── BasicAIChat/
│   │   └── BasicAIChatPanel.vue
│   ├── CollaboratorPanel.vue
│   ├── CommentButton.vue
│   ├── CommentPanel.vue
│   ├── ConfirmDialog.vue       # NModal
│   ├── EmptyState.vue
│   ├── ExportPanel.vue
│   ├── GlobalAIChat.vue
│   ├── KeyboardShortcutsDialog.vue
│   ├── LayoutAside/
│   │   ├── Aside.vue           # NLayout + NMenu
│   │   ├── AboutDialog.vue     # NModal
│   │   ├── SearchDialog.vue    # NModal + NInput
│   │   └── SettingsDialog.vue  # NModal + NTabs
│   ├── MarkdownUploadDialog.vue
│   ├── NotificationBell.vue
│   ├── PageTags.vue            # NTag
│   ├── PasswordInput.vue
│   ├── SelectionAIMenu.vue
│   ├── SharePopover.vue        # NPopover
│   ├── StatusBar.vue
│   ├── TemplateDialog.vue
│   ├── ThemeToggle.vue
│   └── VersionPanel.vue
│
├── blocks/                     # 自定义编辑器块（Vue NodeView）
│   ├── ai/ai.vue
│   ├── blockquote/blockquote.vue
│   ├── callout/callout.vue
│   ├── divider/divider.vue
│   └── mention/mention.vue
│
├── services/                   # 纯 TS，直接从 apps/web 复制
│   ├── request.ts              # axios 封装
│   ├── ai.ts / collaborator.ts / comment.ts
│   ├── folder.ts / notification.ts / page.ts / share.ts
│   ├── tag.ts / upload.ts / user.ts / version.ts
│   └── index.ts
│
├── types/
│   ├── api.ts                  # 复制自 apps/web
│   └── page.ts                 # 复制自 apps/web
│
├── utils/
│   ├── debounce.ts             # 复制自 apps/web
│   ├── exportDocument.ts
│   ├── lcw-confetti.ts
│   ├── query-client.ts
│   ├── randomEmoji.ts
│   ├── request.ts
│   └── wordCount.ts
│
├── data/
│   └── templates.ts            # 复制自 apps/web
│
└── test/
    ├── setup.ts
    ├── helpers.ts
    ├── mocks/ (handlers.ts, server.ts)
    └── interactions/ (doc, doclist, login, sidebar)
```

### 4.6 Naive UI 组件对应

| 场景 | Naive UI 组件 | 替代 React 组件 |
|------|-------------|----------------|
| 全局布局 | `NLayout`, `NLayoutSider`, `NLayoutContent` | Layout |
| 按钮 | `NButton` | Button |
| 弹窗 | `NModal` | Dialog |
| 下拉菜单 | `NDropdown` | DropdownMenu |
| 弹出框 | `NPopover` | Popover |
| 消息提示 | `useMessage` | sonner toast |
| 通知 | `useNotification` | notification |
| 标签 | `NTag` | Badge |
| 标签页 | `NTabs`, `NTabPane` | Tabs |
| 选择器 | `NSelect` | Select / Dropdown |
| 输入框 | `NInput` | Input / Textarea |
| 表单 | `NForm`, `NFormItem` | react-hook-form |
| 头像 | `NAvatar` | Avatar |
| 菜单 | `NMenu` | Sidebar menu |
| 开关 | `NSwitch` | Switch |
| 分隔线 | `NDivider` | Separator |
| 图标 | `NIcon` + `lucide-vue-next` | lucide-react |
| 工具提示 | `NTooltip` | Tooltip |
| 加载 | `NSpin` | - |
| 空状态 | `NEmpty` | EmptyState |
| 颜色选择 | `NColorPicker` | ColorPicker |
| 抽屉 | `NDrawer` | Sheet |
| 滚动条 | `NScrollbar` | - |
| 代码 | `NCode` | - |
| 自动完成 | `NAutoComplete` | Command |

## 五、Pinia Store 设计

### 5.1 auth store

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as userService from '@/services/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('lcwdoc-token'))
  const user = ref<any>(null)
  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await userService.login(email, password)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('lcwdoc-token', res.token)
  }

  async function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('lcwdoc-token')
  }

  return { token, user, isAuthenticated, login, logout }
})
```

### 5.2 theme store

```typescript
// stores/theme.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { darkTheme } from 'naive-ui'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark' | 'system'>(
    (localStorage.getItem('lcwdoc-theme') as any) || 'light'
  )

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return false
  })

  const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

  function setTheme(t: 'light' | 'dark' | 'system') {
    theme.value = t
    localStorage.setItem('lcwdoc-theme', t)
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function applyInitialTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return { theme, isDark, naiveTheme, setTheme, applyInitialTheme }
})
```

## 六、数据流架构

### 6.1 API 层（复制自 apps/web，零改动）

```
apps/web/src/services/request.ts     → 复制 →  apps/web-vue/src/services/request.ts
apps/web/src/services/*.ts           → 复制 →  apps/web-vue/src/services/*.ts
apps/web/src/utils/*.ts              → 复制 →  apps/web-vue/src/utils/*.ts
apps/web/src/types/*.ts              → 复制 →  apps/web-vue/src/types/*.ts
```

纯 TS 文件，不依赖 React，直接复制可用。

### 6.2 数据流

```
Page / View (Vue SFC)
    │
    ├── Pinia Store (auth, theme, notification, page...)
    │       └── Service (axios → NestJS API)
    │
    ├── @tanstack/vue-query (服务端状态缓存)
    │       └── Service (axios → NestJS API)
    │
    └── Editor (provide/inject)
            └── @lcw-doc/vue
                    └── @tiptap/vue-3 → @tiptap/core
                              │
                         Yjs (WebSocket → apps/server)
```

### 6.3 编辑器集成

```
apps/web-vue (app shell)
  └── LcwDocView (@lcw-doc/vue)
        └── provide('lcwDocEditor', editor)
              ├── FormattingToolbar（Vue 组件 → inject editor）
              ├── SideMenu（Vue 组件 → inject editor）
              ├── SuggestionMenu（Vue 组件 → inject editor）
              └── Custom Blocks（Vue NodeView → @tiptap/vue-3）
```

## 七、包依赖关系

```
@lcw-doc/vue
  ├── @tiptap/core
  ├── @tiptap/vue-3
  └── vue (peer)

apps/web-vue
  ├── @lcw-doc/vue (workspace)
  ├── vue / vue-router / pinia
  ├── naive-ui                          ← 唯一 UI 库
  ├── @tanstack/vue-query
  ├── @vue-flow/core
  ├── lucide-vue-next
  ├── @tiptap/vue-3
  ├── axios / date-fns / yjs
  ├── y-indexeddb / y-websocket
  └── canvas-confetti / d3-force / docx / file-saver
```

**React 版不受影响：**
- `@lcw-doc/react`、`@lcw-doc/shadcn`、`@lcw-doc/shadcn-shared-ui` 保持不动
- `@vitejs/plugin-react`、`react-hook-form`、`sonner` 等保持不动

## 八、分阶段实施计划

### Phase 1: 基础骨架（估时：1-2天）

1. 创建 `packages/vue/`，配置 tsup、package.json
2. 创建 `apps/web-vue/` 目录结构
3. Vite 配置（vue plugin + tailwind + proxy）
4. 安装 Vue 3 依赖（vue, vue-router, pinia, naive-ui 等）
5. 实现 `main.ts` + `App.vue`（NConfigProvider）
6. vue-router + Auth Guard
7. Pinia stores（auth, theme）
8. Layout 组件（NLayout + NMenu + NLayoutSider）
9. 复制 apps/web 的纯 TS 文件（services/, utils/, types/）
10. **验证**：`pnpm --filter @lcw-doc/web-vue dev` 启动正常

### Phase 2: 编辑器核心 @lcw-doc/vue（估时：5-7天）

1. **Editor View**: LcwDocView.vue, EditorContent.vue, ElementRenderer.vue
2. **Composables**: useCreateLcwDoc, useLcwDocEditor, useActiveStyles, useSelectedBlocks, usePrefersColorScheme, useEditorChange, useUIElementPositioning 等全部 composable
3. **i18n**: provideDictionary, useDictionary
4. **Block 渲染**: AudioBlockContent, FileBlockContent, ImageBlockContent, VideoBlockContent（Vue NodeView）
5. **Side Menu**: SideMenu, SideMenuController, AddBlockButton, DragHandleButton, DragHandleMenu
6. **Formatting Toolbar**: FormattingToolbar, FormattingToolbarController, 全部按钮 + BlockTypeSelect
7. **Suggestion Menu**: SuggestionMenuController, SuggestionMenuWrapper, GridSuggestionMenu, slash menu items, emoji picker
8. **Link Toolbar**: LinkToolbar, LinkToolbarController, EditLinkMenuItems
9. **File Panel**: FilePanel, FilePanelController, EmbedTab, UploadTab
10. **Table Handles**: TableHandlesController, TableHandle, ExtendButton, TableHandleMenu
11. **Color Picker**: ColorPicker, ColorIcon
12. Schema 适配层（VueBlockSpec 等）
13. **验证**：编辑器渲染、工具栏工作、块渲染、文件上传

### Phase 3: apps/web-vue 业务页面（估时：3-4天）

1. **Login 页面**: NForm 登录/注册，vee-validate 或自定义校验
2. **DocList 页面**: 文档 CRUD，NEmpty 空状态
3. **DocEditor 页面**: 编辑器集成，AvatarList 协作者，DocOutline 大纲
4. **DocGraph 页面**: @vue-flow/core 图谱，自定义 Node/Edge
5. **Share 页面**: 公开分享（只读编辑器）
6. **LayoutAside 侧边栏**: NModal 搜索/设置/关于弹窗
7. **验证**：所有路由页面正常渲染，功能可用

### Phase 4: 业务组件 & 集成（估时：3-4天）

1. **Custom Blocks**: ai, callout, blockquote, divider, mention（Vue NodeView）
2. **AI Chat**: BasicAIChatPanel, GlobalAIChat, SelectionAIMenu
3. **Comment**: CommentPanel, CommentButton
4. **Version**: VersionPanel
5. **Backlinks**: BacklinksPanel
6. **Notifications**: NotificationBell（NBadge + useNotification）
7. **Theme Toggle**: dark/light/system 切换
8. **Export, KeyboardShortcuts, Markdown Upload, Template Dialog**
9. **验证**: 全部集成功能正常工作

### Phase 5: 测试（估时：1-2天）

1. vitest + vue-test-utils 配置
2. 服务层测试（复制自 apps/web，不改）
3. 组件测试（关键业务组件）
4. E2E 测试（Playwright，复用现有测试配置）
5. `turbo build` 整体构建验证
6. 类型检查

### 总工期估算：13-19 天

## 九、关键风险 & 注意事项

### 9.1 `@tiptap/vue-3` NodeView

React 版用 JSX，Vue 版用 SFC：

```vue
<template>
  <NodeViewWrapper class="audio-block">
    <audio :src="node.attrs.url" controls />
  </NodeViewWrapper>
</template>
<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
const props = defineProps<{ node: any; editor: any; updateAttributes: Function; deleteNode: Function }>()
</script>
```

### 9.2 @vue-flow/core

与 `@xyflow/react` API 几乎一致：
- `nodes` / `edges` → reactive ref
- `onNodeClick` → `@node-click`
- 自定义节点 → Vue SFC
- `useVueFlow()` → composable

### 9.3 Naive UI 暗色主题

```vue
<NConfigProvider :theme="isDark ? darkTheme : null">
```

自带完整暗色主题，不需要手动管理 CSS 变量。

### 9.4 图标

推荐 `lucide-vue-next`，图标名与 `lucide-react` 完全一致，迁移参照最省力。

### 9.5 纯 TS 文件直接复制

`services/*.ts`、`utils/*.ts`、`types/*.ts` 直接从 `apps/web/src/` 复制到 `apps/web-vue/src/`，不改一行。两边各自独立维护，后续共享可通过 `packages/shared` 抽离。

### 9.6 开发命令

在根 `package.json` 中加两条 script：

```json
{
  "dev:vue": "pnpm --filter @lcw-doc/web-vue dev",
  "dev:react": "pnpm dev"
}
```

两边可同时启动，不同端口互不干扰。

### 9.7 Yjs 协同不变

`y-indexeddb`、`y-websocket`、后端 `doc-yjs.gateway.ts` 全部框架无关，不动。

## 十、后续扩展

- **Tauri 桌面端**：可直接在 `apps/web-vue` 接入 `@tauri-apps/api`
- **包共享进一步优化**：若 `services/` 需要两端同时维护，可抽成 `packages/shared` 纯 TS 包
- **移动端**：Naive UI 响应式 + Tailwind 断点适配
