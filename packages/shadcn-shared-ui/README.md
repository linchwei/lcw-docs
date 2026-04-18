# @lcw-doc/shadcn-shared-ui

基于 shadcn/ui 的基础 UI 组件库，为 LcwDoc 编辑器提供共享的基础 UI 组件。

## 目录

- [概述](#概述)
- [技术栈](#技术栈)
- [组件列表](#组件列表)
- [主题配置](#主题配置)
- [使用方式](#使用方式)
- [开发指南](#开发指南)

## 概述

ShadcnSharedUI 是一个独立的 UI 组件库包，提供：

- 基础 UI 组件（Button、Input、Dialog 等）
- 主题系统支持（Light/Dark 模式）
- 可访问性支持（基于 Radix UI）
- TypeScript 类型支持

这个包可以被项目中的其他包（如 @lcw-doc/shadcn）依赖使用。

## 技术栈

- **React 19**: UI 框架
- **Radix UI**: 无头 UI 组件原语（提供可访问性和交互逻辑）
- **Tailwind CSS 4**: 样式框架
- **class-variance-authority (cva)**: 组件样式变体管理
- **tailwind-merge**: Tailwind 类名合并
- **clsx**: 条件类名处理
- **Lucide React**: 图标库

## 组件列表

### 基础组件

| 组件 | 文件路径 | 说明 | 依赖 |
|------|----------|------|------|
| `Avatar` | [src/components/ui/avatar.tsx](src/components/ui/avatar.tsx) | 头像组件 | `@radix-ui/react-avatar` |
| `Badge` | [src/components/ui/badge.tsx](src/components/ui/badge.tsx) | 徽章标签 | - |
| `Button` | [src/components/ui/button.tsx](src/components/ui/button.tsx) | 按钮 | `@radix-ui/react-slot` |
| `Collapsible` | [src/components/ui/collapsible.tsx](src/components/ui/collapsible.tsx) | 可折叠面板 | `@radix-ui/react-collapsible` |
| `DropdownMenu` | [src/components/ui/dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx) | 下拉菜单 | `@radix-ui/react-dropdown-menu` |
| `Form` | [src/components/ui/form.tsx](src/components/ui/form.tsx) | 表单组件 | `@radix-ui/react-label`, `react-hook-form` |
| `Input` | [src/components/ui/input.tsx](src/components/ui/input.tsx) | 输入框 | - |
| `Label` | [src/components/ui/label.tsx](src/components/ui/label.tsx) | 标签 | `@radix-ui/react-label` |
| `Popover` | [src/components/ui/popover.tsx](src/components/ui/popover.tsx) | 弹出层 | `@radix-ui/react-popover` |
| `Separator` | [src/components/ui/separator.tsx](src/components/ui/separator.tsx) | 分隔线 | `@radix-ui/react-separator` |
| `Sheet` | [src/components/ui/sheet.tsx](src/components/ui/sheet.tsx) | 侧边抽屉 | `@radix-ui/react-dialog` |
| `Sidebar` | [src/components/ui/sidebar.tsx](src/components/ui/sidebar.tsx) | 侧边栏 | `@radix-ui/react-tooltip` |
| `Skeleton` | [src/components/ui/skeleton.tsx](src/components/ui/skeleton.tsx) | 骨架屏 | - |
| `Toast` | [src/components/ui/toast.tsx](src/components/ui/toast.tsx) | 消息提示 | `@radix-ui/react-toast` |
| `Toaster` | [src/components/ui/toaster.tsx](src/components/ui/toaster.tsx) | 消息提示容器 | `@radix-ui/react-toast` |
| `Tooltip` | [src/components/ui/tooltip.tsx](src/components/ui/tooltip.tsx) | 工具提示 | `@radix-ui/react-tooltip` |

### Hooks

| Hook | 文件路径 | 说明 |
|------|----------|------|
| `useMobile` | [src/hooks/use-mobile.ts](src/hooks/use-mobile.ts) | 检测是否为移动设备 |
| `useToast` | [src/hooks/use-toast.ts](src/hooks/use-toast.ts) | Toast 消息管理 |

### 工具函数

| 函数 | 文件路径 | 说明 |
|------|----------|------|
| `cn` | [src/lib/utils.ts](src/lib/utils.ts) | 类名合并工具（clsx + tailwind-merge） |

## 主题配置

### Tailwind CSS v4 配置

本包使用 Tailwind CSS v4 的 CSS 配置方式，主题定义在 [src/globals.css](src/globals.css) 中：

```css
@import "tailwindcss";

@theme {
  /* 颜色 */
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  
  /* 圆角 */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  
  /* 动画 */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}
```

### CSS 变量

主题使用 CSS 变量定义，支持 Light 和 Dark 模式：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 10% 3.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### 侧边栏主题变量

```css
:root {
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

## 使用方式

### 安装

```bash
pnpm add @lcw-doc/shadcn-shared-ui
```

### 导入样式

在使用组件前，需要先导入全局样式：

```tsx
// 在应用入口文件导入
import '@lcw-doc/shadcn-shared-ui/globals.css';
```

### 使用组件

```tsx
import { Button } from '@lcw-doc/shadcn-shared-ui/components/button';
import { Input } from '@lcw-doc/shadcn-shared-ui/components/input';
import { Label } from '@lcw-doc/shadcn-shared-ui/components/label';

function MyForm() {
  return (
    <div>
      <Label htmlFor="name">姓名</Label>
      <Input id="name" placeholder="请输入姓名" />
      <Button variant="default">提交</Button>
    </div>
  );
}
```

### 使用工具函数

```tsx
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils';

// 合并类名
const className = cn(
  'base-class',
  isActive && 'active-class',
  'conditional-class'
);
```

### 使用 Hooks

```tsx
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: "成功",
      description: "操作已完成",
    });
  };
  
  return <button onClick={handleClick}>显示消息</button>;
}
```

## 开发指南

### 添加新组件

1. 使用 shadcn CLI 添加组件：

```bash
pnpm dlx shadcn@latest add [component-name]
```

2. 组件将自动添加到 `src/components/ui/` 目录

3. 确保更新本 README 的组件列表

### 组件开发规范

- 所有组件必须基于 Radix UI 原语构建
- 使用 `cva` 管理组件样式变体
- 使用 `cn` 工具函数合并类名
- 提供完整的 TypeScript 类型定义
- 支持 `className` 和 `ref` 转发

### 示例组件结构

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## 导出配置

package.json 中的导出配置：

```json
{
  "exports": {
    "./globals.css": "./src/globals.css",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts",
    "./components/*": "./src/components/*.tsx"
  }
}
```

## 依赖关系

```
@lcw-doc/shadcn-shared-ui
├── react ^19.2.0 (peer dependency)
├── @radix-ui/react-* (UI primitives)
├── class-variance-authority ^0.7.1
├── clsx ^2.1.1
├── tailwind-merge ^3.2.0
├── lucide-react ^0.523.0
└── tailwindcss ^4.1.4 (dev dependency)
```

## 相关链接

- [Core 包文档](../core/README.md)
- [React 包文档](../react/README.md)
- [Shadcn 包文档](../shadcn/README.md)
- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [Radix UI 文档](https://www.radix-ui.com/)
