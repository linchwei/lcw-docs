/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '@lcw-doc/vue' {
    import type { DefineComponent } from 'vue'
    import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema, Styles, StyleSchema as _StyleSchema } from '@lcw-doc/core'
    import type { Ref } from 'vue'

    // Components
    export const EditorContent: DefineComponent<{ editor: LcwDocEditor<any, any, any> }>
    export const ElementRenderer: DefineComponent<{ editor: LcwDocEditor<any, any, any> }>
    export const LcwDocView: DefineComponent<any>
    export const LcwDocDefaultUI: DefineComponent<any>

    // Context
    export function provideLcwDocEditor(editor: LcwDocEditor<any, any, any>): void
    export function useLcwDocEditor(): LcwDocEditor<any, any, any>
    export function injectEditor(): LcwDocEditor<any, any, any> | null
    export function provideEditorContext(editor: LcwDocEditor<any, any, any>): void
    export function useEditorContext(): { editor: LcwDocEditor<any, any, any>; contentEditableProps: Ref<Record<string, string>> }

    // Editor creation
    export function useCreateLcwDoc(
        options?: any,
    ): LcwDocEditor<any, any, any>

    // i18n
    export function provideDictionary(dict?: any): void
    export function useDictionary(): any

    // SuggestionMenu
    export const SuggestionMenuController: DefineComponent<{ triggerCharacter: string; getItems?: (query: string) => Promise<any[]> }>

    // Render utilities
    export function renderToDOMSpec(
        fc: (refCB: (el: HTMLElement | null) => void) => any,
        editor?: LcwDocEditor<any, any, any>
    ): { dom: HTMLElement; contentDOM?: HTMLElement }

    // Composables
    export function useEditorChange(callback: () => void, editor?: LcwDocEditor<any, any, any>): void
    export function useEditorSelectionChange(callback: () => void, editor?: LcwDocEditor<any, any, any>): void
    export function useEditorContentOrSelectionChange(callback: () => void, editor?: LcwDocEditor<any, any, any>): void
    export function useEditorForceUpdate(editor: any): Ref<number>
    export function useSelectedBlocks(editor?: LcwDocEditor<any, any, any>): Ref<any[]>
    export function usePrefersColorScheme(): Ref<'dark' | 'light' | 'no-preference'>
    export function useActiveStyles(editor?: LcwDocEditor<any, any, any>): Ref<Record<string, any>>
    export function useUIElementPositioning(
        show: boolean,
        referencePos: DOMRect | null,
        zIndex: number,
        options?: any
    ): {
        isMounted: Ref<boolean>
        ref: Ref<HTMLElement | null>
        style: Ref<Record<string, any>>
        placement: Ref<any>
        getFloatingProps: () => Record<string, any>
        getReferenceProps: () => Record<string, any>
    }
    export function useUIPluginState<State>(onUpdate: (cb: (s: State) => void) => void): Ref<State | undefined>
    export function useOnUploadEnd(callback: (blockId?: string) => void): void
    export function useOnUploadStart(callback: (blockId?: string) => void): void
    export function useUploadLoading(blockId?: string): Ref<boolean>
}
