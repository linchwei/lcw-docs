/**
 * 大纲生成 Agent 的 Prompt 模板
 *
 * 大纲工作流分两个阶段：
 * 1. 生成大纲（GENERATE_OUTLINE_PROMPT）：根据主题生成结构化大纲
 * 2. 逐节展开（EXPAND_SECTION_PROMPT）：根据大纲逐个展开章节内容
 *
 * 占位符说明：
 * - {topic}: 用户输入的文档主题
 * - {requirements}: 用户的额外要求（可选）
 * - {title}: 章节标题
 * - {description}: 章节描述
 *
 * @module prompts/outline
 */

/** 大纲生成提示词：根据主题生成结构化 JSON 大纲 */
export const GENERATE_OUTLINE_PROMPT = `你是一个专业的文档规划师。请为以下主题生成一份结构化的文档大纲。

要求：
1. 大纲应包含 3-5 个主要章节（H1）
2. 每个主要章节下可包含 2-4 个子章节（H2）
3. 每个章节需要简短的描述说明
4. 大纲应该逻辑清晰、层次分明

主题：{topic}
{requirements}

请以 JSON 格式返回大纲，格式如下：
[
  {
    "title": "章节标题",
    "description": "章节描述",
    "level": 1,
    "children": [
      {
        "title": "子章节标题",
        "description": "子章节描述",
        "level": 2,
        "children": []
      }
    ]
  }
]`

/** 章节展开提示词：根据大纲展开单个章节的详细内容 */
export const EXPAND_SECTION_PROMPT = `请根据大纲展开以下章节的详细内容。

要求：
1. 内容应与大纲描述一致
2. 使用专业但易懂的语言
3. 适当使用列表、代码块等格式
4. 内容长度 200-500 字
5. 使用中文

章节标题：{title}
章节描述：{description}
文档主题：{topic}`
