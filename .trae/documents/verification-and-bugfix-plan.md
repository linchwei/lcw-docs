# 验证与Bug修复计划

## 背景

之前实现了 Phase 2-5 增强功能、CI/CD 和监控服务，但所有代码仅通过 TypeScript 编译，未进行运行时验证。经代码审查发现多处运行时问题。

## 调研结果

### 关键发现

1. **`getXmlElement` 是 Yjs 有效方法，但存在语义Bug**：客户端使用 `getXmlFragment` 创建共享类型，服务端调用 `getXmlElement` 时，Yjs 内部会返回已存在的 `XmlFragment` 对象（而非创建新的 `XmlElement`）。运行时不会崩溃，但类型语义不正确，应统一使用 `getXmlFragment`。

2. **`expressIntegration` 在 @sentry/node v10.49.0 中存在**：之前误判为兼容性问题，实际是有效的。**无需修复**。

3. **`storeUpdate` 是 PostgresqlPersistence 的有效方法**：可选链 `?.` 不必要但无害，建议清理。

4. **`XmlFragment.toJSON()` 返回值**：由于底层对象实际就是 `XmlFragment`，替换后 `toJSON()` 行为不变，无需额外 `JSON.stringify()` 包装。

---

## 修复步骤

### Fix-1: 修复 `getXmlElement` → `getXmlFragment`（8处）

**文件与行号：**

| 文件 | 行号 | 当前代码 | 修复后 |
|------|------|----------|--------|
| `version.service.ts` | 32 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `version.scheduler.ts` | 64 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `version.scheduler.ts` | 72 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `sync.service.ts` | 106 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `page.service.ts` | 215 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `page.service.ts` | 243 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `page.service.ts` | 287 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |
| `share.service.ts` | 108 | `doc.getXmlElement(...)` | `doc.getXmlFragment(...)` |

**操作**：全局替换 `getXmlElement` → `getXmlFragment`，保持 `.toJSON()` 不变。

---

### Fix-2: 修复 Prometheus 高基数风险

**文件**：`apps/server/src/fundamentals/metrics/metrics.middleware.ts` 第16行

**当前代码**：
```typescript
const route = req.route?.path || req.originalUrl
```

**修复后**：
```typescript
const route = req.route?.path || 'unknown'
```

**原因**：`req.originalUrl` 包含查询参数和动态路径段，会导致 Prometheus 时间序列爆炸（高基数问题）。

---

### Fix-3: 修复双重关闭处理

**文件**：`apps/server/src/main.ts` 第49-70行

**当前代码**：同时使用 `app.enableShutdownHooks()` 和手动 `process.on('SIGTERM/SIGINT')` 处理器，两者都会调用 `app.close()`，导致双重关闭。

**修复**：移除手动信号处理器（第51-70行），仅保留 `app.enableShutdownHooks()`。

---

### Fix-4: 修复 diff 方法 modified 逻辑

**文件**：`apps/server/src/modules/version/version.service.ts` diff 方法

**当前问题**：`modified` 数组始终为空，因为逻辑只检测了 key 的增删，没有检测相同 key 下内容的变化。

**修复**：在遍历 `map2` 时，对 `map1` 中存在相同 key 的条目进行内容比较：

```typescript
for (const [key, val] of map2) {
    const existing = map1.get(key)
    if (!existing) {
        added.push({ blockType: val.block?.type || 'unknown', content: extractText(val.block) })
    } else {
        const oldContent = extractText(existing.block)
        const newContent = extractText(val.block)
        if (oldContent !== newContent) {
            modified.push({ blockType: val.block?.type || 'unknown', oldContent, newContent })
        }
    }
}
```

---

### Fix-5: 清理未使用代码 + 调整调度频率

#### 5a: version.scheduler.ts 清理

- 移除未使用的 `thirtyMinutesAgo` 变量（第30行）
- 移除未使用的 `MoreThan` 导入（第7行）

#### 5b: metrics.scheduler.ts 调整频率

**文件**：`apps/server/src/fundamentals/metrics/metrics.scheduler.ts` 第11行

**当前**：`@Cron('*/10 * * * * *')` — 每10秒执行
**修复**：`@Cron('* * * * *')` — 每分钟执行

---

### Fix-6: 清理不必要的可选链

**文件与位置**：
- `version.service.ts` 第167行：`this.yjsPostgresqlAdapter.storeUpdate?.(` → `this.yjsPostgresqlAdapter.storeUpdate(`
- `sync.service.ts` 第89行：`this.yjsPostgresqlAdapter.storeUpdate?.(` → `this.yjsPostgresqlAdapter.storeUpdate(`

---

## 验证步骤

### Verify-1: TypeScript 编译验证

```bash
cd /Users/lin/Desktop/levy/project/lcw-docs
pnpm --filter server build
pnpm --filter web build
```

确保编译无错误。

### Verify-2: 启动服务器验证

启动服务端，验证以下端点正常响应：
- `GET /api/health` — 健康检查
- `GET /api/health/ready` — 就绪检查
- `GET /api/health/live` — 存活检查
- `GET /api/metrics` — Prometheus 指标
- `POST /api/auth/login` — 登录
- `GET /api/page` — 页面列表
- 版本相关端点（需登录后测试）

### Verify-3: 前端编译验证

```bash
pnpm --filter web build
```

确保前端编译无错误，包括 VersionPanel 和 IndexedDB 集成。

---

## 执行顺序

1. Fix-1 → Fix-2 → Fix-3 → Fix-4 → Fix-5 → Fix-6（按顺序修复所有Bug）
2. Verify-1（TypeScript编译验证）
3. Verify-2（服务器启动验证）
4. Verify-3（前端编译验证）
