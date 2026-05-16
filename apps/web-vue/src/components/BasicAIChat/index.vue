<template>
    <div class="ai-chat-wrapper">
        <div v-if="!visible" class="ai-trigger" @click="visible = true">
            <span class="trigger-icon">✨</span>
        </div>
        <div v-else class="ai-chat-panel">
            <div class="panel-header">
                <span class="header-title">✨ AI 助手</span>
                <button class="close-btn" @click="visible = false">✕</button>
            </div>
            <div class="messages">
                <div
                    v-for="(msg, i) in messages"
                    :key="i"
                    :class="['message', msg.role]"
                >
                    <div class="message-content">{{ msg.content }}</div>
                </div>
                <div v-if="isLoading" class="message assistant">
                    <div class="message-content loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            </div>
            <div class="input-area">
                <input
                    v-model="input"
                    type="text"
                    placeholder="输入消息..."
                    @keyup.enter="sendMessage"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const input = ref('')
const messages = ref<{ role: string; content: string }[]>([])
const isLoading = ref(false)

async function sendMessage() {
    const text = input.value.trim()
    if (!text || isLoading.value) return

    messages.value.push({ role: 'user', content: text })
    input.value = ''
    isLoading.value = true

    // Placeholder: actual AI integration
    setTimeout(() => {
        messages.value.push({ role: 'assistant', content: 'AI 助手功能待完善' })
        isLoading.value = false
    }, 500)
}
</script>

<style scoped>
.ai-chat-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 360px;
    height: 480px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e9e9e7;
    display: flex;
    flex-direction: column;
    z-index: 100;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e9e9e7;
}

.header-title {
    font-size: 14px;
    font-weight: 600;
    color: #37352f;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #9b9a97;
    font-size: 14px;
    padding: 4px;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.message {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
}

.message.user {
    align-self: flex-end;
    background: #6B45FF;
    color: white;
}

.message.assistant {
    align-self: flex-start;
    background: #f5f5f4;
    color: #37352f;
}

.input-area {
    padding: 12px;
    border-top: 1px solid #e9e9e7;
}

.input-area input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e9e9e7;
    border-radius: 8px;
    outline: none;
    font-size: 14px;
    box-sizing: border-box;
}

.input-area input:focus {
    border-color: #6B45FF;
}

.ai-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #6B45FF;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(107, 69, 255, 0.3);
    z-index: 100;
    transition: transform 0.15s;
}

.ai-trigger:hover {
    transform: scale(1.1);
}

.trigger-icon {
    font-size: 22px;
}
</style>
