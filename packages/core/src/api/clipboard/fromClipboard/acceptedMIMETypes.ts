/**
 * 接受的 MIME 类型
 *
 * 该文件定义了编辑器接受的剪贴板数据类型。
 * 包括 VSCode 数据、编辑器内部 HTML、文件、HTML 和纯文本。
 */
export const acceptedMIMETypes = ['vscode-editor-data', 'lcwdoc/html', 'Files', 'text/html', 'text/plain'] as const