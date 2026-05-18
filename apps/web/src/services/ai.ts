export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface ChatOptions {
    context?: string
    systemPrompt?: string
}

export async function chatWithAI(messages: ChatMessage[], signal?: AbortSignal, options?: ChatOptions): Promise<Response> {
    const token = localStorage.getItem('token')

    const finalMessages = [...messages]

    if (options?.systemPrompt) {
        const systemIdx = finalMessages.findIndex(m => m.role === 'system')
        if (systemIdx >= 0) {
            finalMessages[systemIdx] = { ...finalMessages[systemIdx], content: options.systemPrompt }
        } else {
            finalMessages.unshift({ role: 'system', content: options.systemPrompt })
        }
    }

    if (options?.context) {
        const systemIdx = finalMessages.findIndex(m => m.role === 'system')
        if (systemIdx >= 0) {
            finalMessages[systemIdx] = {
                ...finalMessages[systemIdx],
                content: finalMessages[systemIdx].content + '\n\n当前文档内容：\n' + options.context,
            }
        } else {
            finalMessages.unshift({ role: 'system', content: '当前文档内容：\n' + options.context })
        }
    }

    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: finalMessages }),
        ...(signal ? { signal } : {}),
    })

    return response
}
