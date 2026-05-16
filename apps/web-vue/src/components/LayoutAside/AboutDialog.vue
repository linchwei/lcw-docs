<template>
    <NModal v-model:show="modelOpen" preset="card" style="width: 600px" title="关于协同文档" @update:show="onOpenChange">
        <div class="about-content">
            <div class="tabs">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    :class="['tab-btn', { active: activeTab === tab.id }]"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>

            <!-- About tab -->
            <div v-if="activeTab === 'about'" class="tab-content">
                <div class="about-header">
                    <div class="about-logo">
                        <div class="logo-icon" />
                    </div>
                    <h2 class="about-title">协同文档</h2>
                    <span class="about-version">v0.1.0</span>
                    <p class="about-desc">一个轻量级的协同文档编辑平台</p>
                </div>
                <div class="core-features">
                    <div v-for="f in coreFeatures" :key="f.title" class="feature-card">
                        <div class="feature-icon">
                            <component :is="f.icon" :size="16" />
                        </div>
                        <div>
                            <p class="feature-name">{{ f.title }}</p>
                            <p class="feature-desc">{{ f.desc }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shortcuts tab -->
            <div v-if="activeTab === 'shortcuts'" class="tab-content">
                <div v-for="group in shortcutGroups" :key="group.category" class="shortcut-group">
                    <h3 class="group-title">{{ group.category }}</h3>
                    <div v-for="item in group.items" :key="item.description" class="shortcut-row">
                        <span class="shortcut-desc">{{ item.description }}</span>
                        <div class="shortcut-keys">
                            <span v-for="(key, i) in item.keys" :key="i" class="shortcut-key">
                                {{ key }}<span v-if="i < item.keys.length - 1" class="shortcut-plus">+</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Markdown tab -->
            <div v-if="activeTab === 'markdown'" class="tab-content">
                <div v-for="group in markdownGroups" :key="group.category" class="md-group">
                    <h3 class="group-title">{{ group.category }}</h3>
                    <div v-for="item in group.items" :key="item.syntax" class="md-row">
                        <code class="md-syntax">{{ item.syntax }}</code>
                        <span class="md-effect">{{ item.label }}</span>
                    </div>
                </div>
            </div>
        </div>
    </NModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { FileText, Users, Brain, BookOpen } from 'lucide-vue-next'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
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

type TabId = 'about' | 'shortcuts' | 'markdown'

const activeTab = ref<TabId>('about')

const tabs = [
    { id: 'about' as TabId, label: '关于' },
    { id: 'shortcuts' as TabId, label: '快捷键' },
    { id: 'markdown' as TabId, label: 'Markdown 语法' },
]

const coreFeatures = [
    { icon: FileText, title: '块编辑器', desc: '所见即所得的富文本编辑体验' },
    { icon: Users, title: '实时协作', desc: '多人同时编辑，光标实时同步' },
    { icon: Brain, title: 'AI 助手', desc: '智能写作、续写、翻译、总结' },
    { icon: BookOpen, title: '模板库', desc: '预设模板一键创建结构化文档' },
]

const shortcutGroups = [
    {
        category: '通用',
        items: [
            { keys: ['⌘', 'K'], description: '搜索文档' },
        ],
    },
    {
        category: '编辑',
        items: [
            { keys: ['⌘', 'Z'], description: '撤销' },
            { keys: ['⌘', '⇧', 'Z'], description: '重做' },
            { keys: ['⌘', 'B'], description: '加粗' },
            { keys: ['⌘', 'I'], description: '斜体' },
            { keys: ['⌘', 'U'], description: '下划线' },
            { keys: ['⌘', 'K'], description: '插入链接' },
        ],
    },
    {
        category: '块级快捷格式',
        items: [
            { keys: ['>', 'Space'], description: '引用块' },
            { keys: ['---', 'Space'], description: '分割线' },
            { keys: ['[text](url)'], description: '超链接' },
            { keys: ['/'], description: '插入块菜单' },
            { keys: ['@'], description: '引用文档' },
        ],
    },
]

const markdownGroups = [
    {
        category: '标题',
        items: [
            { syntax: '# 标题', label: '一级标题' },
            { syntax: '## 标题', label: '二级标题' },
            { syntax: '### 标题', label: '三级标题' },
        ],
    },
    {
        category: '文本格式',
        items: [
            { syntax: '**粗体**', label: '粗体文字' },
            { syntax: '*斜体*', label: '斜体文字' },
            { syntax: '~~删除线~~', label: '删除线文字' },
            { syntax: '==高亮==', label: '高亮标记' },
        ],
    },
    {
        category: '插入元素',
        items: [
            { syntax: '[文字](链接)', label: '超链接' },
            { syntax: '![描述](图片URL)', label: '图片' },
            { syntax: '/', label: '打开插入块菜单' },
            { syntax: '@', label: '引用其他文档' },
        ],
    },
]
</script>

<style scoped>
.about-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.tab-btn {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    background: #f4f4f5;
    color: #71717a;
}

.tab-btn.active {
    background: #37352f;
    color: white;
}

.tab-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.about-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
}

.about-logo {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #6B45FF;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-icon {
    width: 24px;
    height: 28px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.9);
}

.about-title {
    font-size: 20px;
    font-weight: 600;
    color: #37352f;
    margin: 0;
}

.about-version {
    font-size: 12px;
    color: #9b9a97;
}

.about-desc {
    font-size: 14px;
    color: #787774;
    margin: 0;
}

.core-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.feature-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e4e4e7;
}

.feature-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #f4f4f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #52525b;
}

.feature-name {
    font-size: 13px;
    font-weight: 500;
    margin: 0 0 2px;
    color: #37352f;
}

.feature-desc {
    font-size: 12px;
    color: #9b9a97;
    margin: 0;
}

.group-title {
    font-size: 13px;
    font-weight: 500;
    color: #9b9a97;
    margin: 0 0 8px;
}

.shortcut-group, .md-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.shortcut-row, .md-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
}

.shortcut-desc {
    font-size: 14px;
    color: #37352f;
}

.shortcut-keys {
    display: flex;
    gap: 2px;
}

.shortcut-key {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 4px;
    border: 1px solid #e4e4e7;
    background: #fafafa;
    font-family: monospace;
    font-size: 11px;
    color: #52525b;
}

.shortcut-plus {
    color: #9b9a97;
    font-size: 11px;
    margin: 0 2px;
}

.md-syntax {
    font-size: 13px;
    font-family: monospace;
    background: #f4f4f5;
    padding: 2px 8px;
    border-radius: 4px;
    color: #37352f;
}

.md-effect {
    font-size: 13px;
    color: #9b9a97;
}
</style>
