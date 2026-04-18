import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import { chatWithAI, ChatMessage } from '@/services'

interface SelectionAIMenuProps {
    editor: any
}

const aiActions = [
    { label: '续写', prompt: '请续写以下内容，保持风格一致：\n\n' },
    { label: '改写', prompt: '请改写以下内容，使其更清晰流畅：\n\n' },
    { label: '润色', prompt: '请润色以下内容，使其更加优美专业，修正语法和用词：\n\n' },
    { label: '缩写', prompt: '请精简以下内容，保留核心要点，去除冗余：\n\n' },
    { label: '扩写', prompt: '请扩写以下内容，增加细节和论据，使内容更丰富：\n\n' },
    { label: '解释', prompt: '请用通俗易懂的语言解释以下内容：\n\n' },
    { label: '翻译', prompt: '请将以下内容翻译为英文（如果是中文）或中文（如果是英文）：\n\n' },
    { label: '总结', prompt: '请总结以下内容的要点：\n\n' },
]

const SYSTEM_PROMPT = '你是一个专业的文档编辑助手。请根据用户的要求处理文本内容，直接输出处理结果，不要添加多余的解释。'

export function SelectionAIMenu({ editor }: SelectionAIMenuProps) {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
    const [selectedText, setSelectedText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const updatePosition = useCallback(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            setPosition(null)
            setSelectedText('')
            return
        }

        const text = selection.toString().trim()
        if (!text) {
            setPosition(null)
            return
        }

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        if (rect.width === 0 && rect.height === 0) {
            setPosition(null)
            return
        }

        setSelectedText(text)
        setPosition({
            top: rect.top + window.scrollY - 40,
            left: rect.left + window.scrollX + rect.width / 2,
        })
    }, [])

    useEffect(() => {
        const handleSelectionChange = () => {
            if (isGenerating) return
            setTimeout(updatePosition, 10)
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        document.addEventListener('mouseup', handleSelectionChange)

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
            document.removeEventListener('mouseup', handleSelectionChange)
        }
    }, [updatePosition, isGenerating])

    const handleAction = useCallback(async (action: typeof aiActions[0]) => {
        if (!selectedText || isGenerating) return

        setIsGenerating(true)
        setPosition(null)

        try {
            const messages: ChatMessage[] = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: action.prompt + selectedText },
            ]

            const response = await chatWithAI(messages)

            if (!response.ok) {
                setIsGenerating(false)
                return
            }

            const reader = response.body?.getReader()
            if (!reader) {
                setIsGenerating(false)
                return
            }

            const decoder = new TextDecoder()
            let accumulated = ''
            let sseBuffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                sseBuffer += decoder.decode(value, { stream: true })
                const lines = sseBuffer.split('\n')
                sseBuffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim()
                        if (dataStr === '[DONE]') continue
                        try {
                            const data = JSON.parse(dataStr)
                            if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
                                console.error('AI API error:', data.base_resp.status_msg)
                                break
                            }
                            const content = data.choices?.[0]?.delta?.content
                            if (content) {
                                accumulated += content
                            }
                        } catch (e: any) {
                            if (e.message && !e.message.includes('JSON')) {
                                console.error('AI API error:', e.message)
                                break
                            }
                        }
                    }
                }
            }

            if (accumulated) {
                try {
                    const blocks = await editor.tryParseMarkdownToBlocks(accumulated)
                    const currentBlock = editor.getTextCursorPosition().block
                    editor.insertBlocks(blocks, currentBlock, 'after')
                } catch {
                    const tiptapEditor = editor._tiptapEditor
                    tiptapEditor.chain().focus().insertContentAt(
                        tiptapEditor.state.selection.to,
                        accumulated
                    ).run()
                }
            }
        } catch {
        } finally {
            setIsGenerating(false)
        }
    }, [selectedText, isGenerating, editor])

    if (!position || !selectedText) {
        return null
    }

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                border: '1px solid #e9e9e7',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '4px', borderRight: '1px solid #e9e9e7', marginRight: '2px' }}>
                <Sparkles size={14} color="#6B45FF" />
            </div>
            {aiActions.map(action => (
                <button
                    key={action.label}
                    onClick={() => handleAction(action)}
                    disabled={isGenerating}
                    style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: '#37352f',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isGenerating ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                        opacity: isGenerating ? 0.5 : 1,
                    }}
                    onMouseEnter={e => {
                        if (!isGenerating) (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f4'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }}
                >
                    {action.label}
                </button>
            ))}
        </div>,
        document.body
    )
}
