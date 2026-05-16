<script setup lang="ts">
import { useEditorContext } from './editorContext'

defineProps<{
    formattingToolbar?: boolean
    linkToolbar?: boolean
    slashMenu?: boolean
    sideMenu?: boolean
    filePanel?: boolean
    tableHandles?: boolean
    emojiPicker?: boolean
}>()

// Ensure we're inside a LcwDocView context
useEditorContext()
</script>

<template>
    <!-- Phase 3: 实现各 Controller 组件 -->
    <slot />
</template>
