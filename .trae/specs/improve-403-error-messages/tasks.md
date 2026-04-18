# Tasks

- [x] Task 1: 创建 ForbiddenError 自定义异常类，支持 code 和中文 message
  - [x] 在 `apps/server/src/fundamentals/common/exceptions/` 下创建 `forbidden.exception.ts`
  - [x] 定义错误码枚举：`FORBIDDEN_NO_ACCESS`、`FORBIDDEN_NOT_OWNER`、`FORBIDDEN_ROLE_INSUFFICIENT`、`FORBIDDEN_SELF_OPERATION`
  - [x] 自定义异常继承 ForbiddenException，额外携带 code 字段

- [x] Task 2: 修改 AllExceptionsFilter，403 响应增加 code 字段
  - [x] 修改 `apps/server/src/fundamentals/common/filters/all-exceptions.filter.ts`
  - [x] 当异常为自定义 ForbiddenException 时，将 code 字段加入响应体

- [x] Task 3: 替换 collaborator.service.ts 中的模糊 ForbiddenException
  - [x] 将 `throw new ForbiddenException('no access')` (line 36) 替换为具体中文消息 + 错误码
  - [x] 将 `throw new ForbiddenException('no permission')` (line 141) 替换为具体中文消息 + 错误码
  - [x] 将 `throw new ForbiddenException('only owner can add collaborators')` (line 73) 替换为中文消息 + 错误码
  - [x] 将 `throw new ForbiddenException('only owner can update collaborators')` (line 120) 替换为中文消息 + 错误码
  - [x] 将 `throw new ForbiddenException('cannot add yourself')` (line 84) 替换为中文消息 + 错误码

- [x] Task 4: 替换 page.service.ts 中的模糊 ForbiddenException
  - [x] 将 `throw new ForbiddenException('no access')` (line 61) 替换为具体中文消息 + 错误码

- [x] Task 5: 前端 request.ts 增加 403 错误处理
  - [x] 修改 `apps/web/src/utils/request.ts`
  - [x] 在响应拦截器中增加 403 状态码处理
  - [x] 使用 toast 展示后端返回的 message，无 message 时展示默认提示 "您没有执行此操作的权限"

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2 (需要后端响应格式确定)
