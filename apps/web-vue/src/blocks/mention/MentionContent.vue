<template>
    <RouterLink
        :to="`/doc/${pageId}`"
        class="mention-link"
    >
        <span class="mention-icon">{{ displayIcon }}</span>
        {{ displayTitle }}
    </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface Props {
    pageId: string
    title?: string
    icon?: string
}

const props = defineProps<Props>()

const displayIcon = props.icon || '📄'
const displayTitle = props.title || '未命名文档'
</script>

<style scoped>
.mention-link {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    margin: 0 2px;
    background-color: #e9d5ff;
    border-radius: 999px;
    font-size: 14px;
    color: #6b21a8;
    text-decoration: none;
    white-space: nowrap;
}

.mention-link:hover {
    background-color: #d8b4fe;
}

.mention-icon {
    margin-right: 3px;
    font-size: 13px;
}
</style>
