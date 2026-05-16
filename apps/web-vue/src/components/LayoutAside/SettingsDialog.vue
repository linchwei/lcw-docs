<template>
    <NModal v-model:show="modelOpen" preset="card" style="width: 480px" title="设置" @update:show="onOpenChange">
        <div class="settings-content">
            <div class="setting-item">
                <span class="setting-label">用户名</span>
                <span class="setting-value">{{ username || '—' }}</span>
            </div>
            <div class="setting-item">
                <span class="setting-label">主题</span>
                <div class="theme-options">
                    <button
                        v-for="option in themeOptions"
                        :key="option.value"
                        :class="['theme-btn', { active: theme === option.value }]"
                        @click="setTheme(option.value)"
                    >
                        {{ option.label }}
                    </button>
                </div>
            </div>
        </div>
    </NModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'

type Theme = 'light' | 'dark' | 'system'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    username?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

const modelOpen = computed({
    get: () => props.open,
    set: (val: boolean) => {
        emit('update:open', val)
        props.onOpenChange(val)
    },
})

const themeOptions = [
    { value: 'light' as Theme, label: '浅色' },
    { value: 'dark' as Theme, label: '深色' },
    { value: 'system' as Theme, label: '跟随系统' },
]

function getStoredTheme(): Theme {
    return (localStorage.getItem('lcwdoc-theme') as Theme) || 'system'
}

const theme = ref<Theme>(getStoredTheme())

function applyTheme(t: Theme) {
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
}

function setTheme(t: Theme) {
    theme.value = t
    localStorage.setItem('lcwdoc-theme', t)
    applyTheme(t)
}

watch(theme, (t) => {
    applyTheme(t)
})

// Track system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme.value === 'system') {
            applyTheme('system')
        }
    })
}
</script>

<style scoped>
.settings-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e9e9e7;
}

.setting-label {
    font-size: 14px;
    color: #787774;
}

.setting-value {
    font-size: 14px;
    font-weight: 500;
    color: #37352f;
}

.theme-options {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e9e9e7;
}

.theme-btn {
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    cursor: pointer;
    background: white;
    color: #787774;
    transition: all 0.15s;
}

.theme-btn:hover {
    background: #f5f5f4;
}

.theme-btn.active {
    background: #37352f;
    color: white;
}
</style>
