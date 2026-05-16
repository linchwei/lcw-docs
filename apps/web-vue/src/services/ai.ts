export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export async function chatWithAI(messages: ChatMessage[], signal?: AbortSignal): Promise<Response> {
    const token = localStorage.getItem('token')

    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages }),
        ...(signal ? { signal } : {}),
    })

    return response
}
