# 清理未使用/废弃代码文件计划

## 分析方法

对项目中所有代码文件进行了全面排查，通过以下方式确认文件是否未使用：

1. 全局搜索 `import` 语句，确认文件是否被其他代码引用
2. 检查 `app.module.ts` 确认服务端模块是否注册
3. 检查文件命名是否包含 V1/Demo 等废弃标记
4. 排除所有 CSS Module 文件（它们通过 `styles.xxx` 方式引用，已确认都在使用）

## 确认可删除的文件（共 17 个）

### 前端 apps/web/src（4 个文件）

| # | 文件路径                            | 未使用原因                          |
| - | ------------------------------- | ------------------------------ |
| 1 | `pages/Doc/DocEditorV1.tsx`     | 旧版编辑器，文件名含 V1，全局无 import 引用    |
| 2 | `pages/Doc/DocEditorDemo.tsx`   | 演示用编辑器，文件名含 Demo，全局无 import 引用 |
| 3 | `pages/Account/Login/World.tsx` | 登录页装饰组件，全局无 import 引用          |
| 4 | `pages/Account/Login/TaiJi.tsx` | 登录页太极动画组件，全局无 import 引用        |

### 后端 apps/server/src（13 个文件）

| #  | 文件路径                                                        | 未使用原因                                          |
| -- | ----------------------------------------------------------- | ---------------------------------------------- |
| 5  | `fundamentals/common/decorators/roles.decorator.ts`         | 全局无 import 引用                                  |
| 6  | `fundamentals/common/guards/roles.guard.ts`                 | 仅被 roles.decorator.ts 关联，两者均未使用                |
| 7  | `fundamentals/common/interceptors/timeout.interceptor.ts`   | 全局无 import 引用                                  |
| 8  | `fundamentals/common/interceptors/logging.interceptor.ts`   | 全局无 import 引用                                  |
| 9  | `fundamentals/common/interceptors/exception.interceptor.ts` | 全局无 import 引用（导出类名为 ErrorsInterceptor）         |
| 10 | `fundamentals/common/interceptors/transform.interceptor.ts` | 全局无 import 引用                                  |
| 11 | `fundamentals/common/middleware/logger.middleware.ts`       | 全局无 import 引用                                  |
| 12 | `fundamentals/common/pipes/parse-int.pipe.ts`               | 全局无 import 引用                                  |
| 13 | `fundamentals/common/pipes/validation.pipe.ts`              | 全局无 import 引用（项目使用 zod-validation.pipe.ts）     |
| 14 | `fundamentals/tasks/tasks.module.ts`                        | 未在 app.module.ts 中注册                           |
| 15 | `fundamentals/tasks/tasks.service.ts`                       | 未在 app.module.ts 中注册，仅被 tasks.module.ts 内部引用   |
| 16 | `fundamentals/jobs/audio/audio.module.ts`                   | 未在 app.module.ts 中注册                           |
| 17 | `fundamentals/jobs/audio/audio.processor.ts`                | 未在 app.module.ts 中注册，仅被 audio.module.ts 内部引用   |
| 18 | `modules/ws-demo/ws-demo.module.ts`                         | 未在 app.module.ts 中注册                           |
| 19 | `modules/ws-demo/ws-demo.gateway.ts`                        | 未在 app.module.ts 中注册，仅被 ws-demo.module.ts 内部引用 |

> 注：`fundamentals/common/filters/http-exception.filter.ts` **确认在使用**（被 main.ts 引用），不删除。

### 类型文件（1 个）

| #  | 文件路径                                 | 未使用原因         |
| -- | ------------------------------------ | ------------- |
| 20 | `apps/web/src/types/event-source.ts` | 全局无 import 引用 |

### 工具文件（1 个）

| #  | 文件路径                           | 未使用原因                       |
| -- | ------------------------------ | --------------------------- |
| 21 | `apps/web/src/utils/crypto.ts` | 全局无 import 引用，前端不应使用 bcrypt |

## 确认保留的文件（之前可疑但确认在使用）

| 文件                                | 引用位置                              |
| --------------------------------- | --------------------------------- |
| `DocList.module.css`              | DocList/index.tsx 引用              |
| `use-click-outside.ts`            | BasicAIChat/index.tsx 引用          |
| `ThemeToggle/`                    | Login/index.tsx 引用                |
| `PasswordInput/`                  | Login/index.tsx 引用                |
| `EmptyState/`                     | DocList/index.tsx 引用              |
| `MarkdownUploadDialog.module.css` | MarkdownUploadDialog/index.tsx 引用 |
| `Login.module.css`                | Login/index.tsx 引用                |
| `debounce.ts`                     | Doc/index.tsx 引用                  |
| `http-exception.filter.ts`        | main.ts 引用                        |
| `application.entity.ts`           | ApplicationModule 引用              |
| `comment.entity.ts`               | CommentModule 引用                  |

## 实施步骤

### 第一步：删除前端未使用文件（6 个）

删除以下文件：

* `apps/web/src/pages/Doc/DocEditorV1.tsx`

* `apps/web/src/pages/Doc/DocEditorDemo.tsx`

* `apps/web/src/pages/Account/Login/World.tsx`

* `apps/web/src/pages/Account/Login/TaiJi.tsx`

* `apps/web/src/types/event-source.ts`

* `apps/web/src/utils/crypto.ts`

### 第二步：删除后端未使用文件（13 个）

删除以下文件/目录：

* `apps/server/src/fundamentals/common/decorators/roles.decorator.ts`

* `apps/server/src/fundamentals/common/guards/roles.guard.ts`

* `apps/server/src/fundamentals/common/interceptors/timeout.interceptor.ts`

* `apps/server/src/fundamentals/common/interceptors/logging.interceptor.ts`

* `apps/server/src/fundamentals/common/interceptors/exception.interceptor.ts`

* `apps/server/src/fundamentals/common/interceptors/transform.interceptor.ts`

* `apps/server/src/fundamentals/common/middleware/logger.middleware.ts`

* `apps/server/src/fundamentals/common/pipes/parse-int.pipe.ts`

* `apps/server/src/fundamentals/common/pipes/validation.pipe.ts`

* `apps/server/src/fundamentals/tasks/` （整个目录）

* `apps/server/src/fundamentals/jobs/audio/` （整个目录）

* `apps/server/src/modules/ws-demo/` （整个目录）

### 第三步：检查空目录

删除文件后，检查以下目录是否变为空目录，如果是则一并删除：

* `apps/server/src/fundamentals/common/decorators/`

* `apps/server/src/fundamentals/common/guards/`

* `apps/server/src/fundamentals/common/interceptors/`

* `apps/server/src/fundamentals/common/middleware/`

* `apps/server/src/fundamentals/jobs/`

* `apps/server/src/fundamentals/tasks/`

### 第四步：验证

* 启动开发服务器，确认项目正常运行

* 浏览器访问各页面确认无报错

