// 编辑器上下文
export { provideLcwDocEditor, useLcwDocEditor, injectEditor } from './editor/inject'
export { provideEditorContext, useEditorContext } from './editor/editorContext'
export { default as ElementRenderer } from './editor/ElementRenderer.vue'
export { default as EditorContent } from './editor/EditorContent.vue'
export { default as LcwDocView } from './editor/LcwDocView.vue'
export { default as LcwDocDefaultUI } from './editor/LcwDocDefaultUI.vue'

// SuggestionMenu
export { default as SuggestionMenuController } from './components/SuggestionMenu/SuggestionMenuController.vue'

// 编辑器创建
export { useCreateLcwDoc } from './composables/useCreateLcwDoc'

// i18n
export { useDictionary, provideDictionary } from './i18n/dictionary'

// 渲染工具
export { renderToDOMSpec } from './schema/@util/VueRenderUtil'

// 块和内联内容规范
export { createVueBlockSpec } from './schema/VueBlockSpec'
export type { VueCustomBlockRenderProps, VueCustomBlockImplementation } from './schema/VueBlockSpec'
export { createVueInlineContentSpec } from './schema/VueInlineContentSpec'
export type { VueInlineContentImplementation } from './schema/VueInlineContentSpec'

// Composable hooks
export { useEditorChange } from './composables/useEditorChange'
export { useEditorSelectionChange } from './composables/useEditorSelectionChange'
export { useEditorContentOrSelectionChange } from './composables/useEditorContentOrSelectionChange'
export { useEditorForceUpdate } from './composables/useEditorForceUpdate'
export { useSelectedBlocks } from './composables/useSelectedBlocks'
export { usePrefersColorScheme } from './composables/usePrefersColorScheme'
export { useActiveStyles } from './composables/useActiveStyles'
export { useUIElementPositioning } from './composables/useUIElementPositioning'
export { useUIPluginState } from './composables/useUIPluginState'
export { useOnUploadEnd } from './composables/useOnUploadEnd'
export { useOnUploadStart } from './composables/useOnUploadStart'
export { useUploadLoading } from './composables/useUploadLoading'
