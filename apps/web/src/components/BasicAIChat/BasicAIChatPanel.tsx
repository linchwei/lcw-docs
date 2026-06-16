import { BlockSchema, InlineContentSchema, LcwDocEditor, PartialBlock, StyleSchema } from '@lcw-doc/core'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import TextareaAutosize from 'react-textarea-autosize'

import { ChatMessage, StructuredContext, chatWithAgent, extractStructuredContextFromEditor } from '@/services'
import { useAIStream } from '@/hooks/useAIStream'

interface BasicAIChatPanelProps<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> {
    editor?: LcwDocEditor<BSchema, ISchema, SSchema>
    onResponse?: (response: PartialBlock<BSchema, ISchema, SSchema>[]) => void
}

const SYSTEM_PROMPT =
    '你是一个专业的文档编辑助手。你可以帮助用户撰写、改写、翻译和总结文档内容。请用中文回复，保持专业和友好的语气。当用户提供文档上下文时，请基于上下文内容进行回答。'

export function BasicAIChatPanel<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(
    props: BasicAIChatPanelProps<BSchema, ISchema, SSchema>
) {
    const [keyword, setKeyword] = useState('')
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

    // 使用统一的 AI 流式 Hook
    const { content: streamContent, isGenerating, startStream, cancel } = useAIStream()

    const handleSend = async () => {
        if (!keyword.trim() || isGenerating) return

        // 提取编辑器结构化上下文
        let context: StructuredContext | undefined
        if (props.editor) {
            try {
                const blocks = props.editor.document as any[]
                context = extractStructuredContextFromEditor(blocks)
            } catch {
                void 0
            }
        }

        const userMessage: ChatMessage = { role: 'user', content: keyword }
        const systemMessage: ChatMessage = { role: 'system', content: SYSTEM_PROMPT }
        const messages: ChatMessage[] = [systemMessage, ...chatHistory, userMessage]

        // startStream 返回累积的完整内容，避免闭包陷阱
        const result = await startStream(async (signal) => {
            return chatWithAgent(messages, context, undefined, signal)
        })

        setKeyword('')

        // 使用返回值更新消息历史
        if (result) {
            setChatHistory(prev => [...prev, userMessage, { role: 'assistant', content: result }])

            // 解析为 Block 并回调
            let blocks: PartialBlock<BSchema, ISchema, SSchema>[]
            try {
                if (props.editor) {
                    blocks = (await props.editor.tryParseMarkdownToBlocks(result)) as PartialBlock<BSchema, ISchema, SSchema>[]
                } else {
                    blocks = [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: result, styles: {} }],
                        },
                    ] as PartialBlock<BSchema, ISchema, SSchema>[]
                }
            } catch {
                blocks = [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: result, styles: {} }],
                    },
                ] as PartialBlock<BSchema, ISchema, SSchema>[]
            }

            if (props.onResponse) {
                props.onResponse(blocks)
            }
        }
    }

    const handleCancel = () => {
        cancel()
    }

    const ref = useHotkeys(
        'Enter',
        () => {
            if (!isGenerating) {
                handleSend()
            }
        },
        {
            enableOnFormTags: true,
        }
    )

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '8px',
                backgroundColor: '#f7f6f3',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e9e9e7',
            }}
        >
            {streamContent && (
                <div
                    style={{
                        fontSize: '13px',
                        color: '#37352f',
                        lineHeight: '1.5',
                        padding: '4px 8px',
                        marginBottom: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {streamContent}
                    {isGenerating && (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '2px',
                                height: '14px',
                                backgroundColor: '#6B45FF',
                                marginLeft: '1px',
                                verticalAlign: 'text-bottom',
                                animation: 'blink 1s infinite',
                            }}
                        />
                    )}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                    <Sparkles color="#6B45FF" size={18} />
                </div>
                <TextareaAutosize
                    disabled={isGenerating}
                    ref={ref as any}
                    placeholder="请输入你想书写的主题，我来帮你发挥"
                    autoFocus
                    style={{
                        flex: 1,
                        outline: 'none',
                        padding: '0 8px',
                        resize: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '13px',
                        color: '#37352f',
                        border: 'none',
                    }}
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                />
                {isGenerating ? (
                    <button
                        onClick={handleCancel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #e9e9e7',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} color="#787774" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!keyword.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: keyword.trim() ? '#6B45FF' : '#ebebea',
                            color: keyword.trim() ? '#fff' : '#9b9a97',
                            cursor: keyword.trim() ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                        }}
                    >
                        <ArrowUp size={14} />
                    </button>
                )}
            </div>
        </div>
    )
}
