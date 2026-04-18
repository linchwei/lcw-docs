# Tasks

- [x] Task 1: 在 main.ts 中注册 Swagger extraModels
  - [x] SubTask 1.1: 创建通用响应包装器类型并注册到 Swagger

- [x] Task 2: 为 Auth/User 控制器添加 @ApiBody 和 @ApiResponse（4+1 端点）
  - [x] SubTask 2.1: AuthController - login/logout/currentUser/getProfile
  - [x] SubTask 2.2: UserController - register

- [x] Task 3: 为 Page 控制器添加 @ApiBody 和 @ApiResponse（14 端点）
  - [x] SubTask 3.1: create/update/delete 端点的 @ApiBody
  - [x] SubTask 3.2: 所有端点的 @ApiResponse

- [x] Task 4: 为 Tag 控制器添加 @ApiBody 和 @ApiResponse（9 端点）
  - [x] SubTask 4.1: create/update/addPageTag/batch 端点的 @ApiBody
  - [x] SubTask 4.2: 所有端点的 @ApiResponse

- [x] Task 5: 为 Share/Collaborator/Comment 控制器添加 @ApiBody 和 @ApiResponse（14 端点）
  - [x] SubTask 5.1: Share - create 端点的 @ApiBody + 所有端点 @ApiResponse
  - [x] SubTask 5.2: Collaborator - add/update 端点的 @ApiBody + 所有端点 @ApiResponse
  - [x] SubTask 5.3: Comment - create/reply 端点的 @ApiBody + 所有端点 @ApiResponse

- [x] Task 6: 为 Folder/AI/Upload 控制器添加 @ApiBody 和 @ApiResponse（6 端点）
  - [x] SubTask 6.1: Folder - create/update 端点的 @ApiBody + 所有端点 @ApiResponse
  - [x] SubTask 6.2: AI - chat 端点的 @ApiBody + @ApiResponse
  - [x] SubTask 6.3: Upload - @ApiBody(multipart) + @ApiResponse

- [x] Task 7: 为 Notification/Version/Audit/Application/Sync 控制器添加 @ApiBody 和 @ApiResponse（19 端点）
  - [x] SubTask 7.1: Notification - 所有端点 @ApiResponse
  - [x] SubTask 7.2: Version - create 端点 @ApiBody + 所有端点 @ApiResponse
  - [x] SubTask 7.3: Audit/Application/Sync - @ApiBody + @ApiResponse

- [x] Task 8: 验证 Swagger JSON 包含完整的 requestBody 和 response schema
  - [x] SubTask 8.1: 启动服务器，curl /doc-json 验证所有端点有 body 和 response
  - [x] SubTask 8.2: TypeScript 编译通过

# Task Dependencies
- [Task 2-7] depends on [Task 1]
- [Task 8] depends on [Task 2-7]
