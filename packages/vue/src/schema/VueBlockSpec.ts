import {
    applyNonSelectableBlockFix,
    BlockFromConfig,
    BlockSchemaWithBlock,
    camelToDataKebab,
    createInternalBlockSpec,
    createStronglyTypedTiptapNode,
    CustomBlockConfig,
    getBlockFromPos,
    getParseRules,
    inheritedProps,
    InlineContentSchema,
    LcwDocEditor,
    mergeCSSClasses,
    PartialBlockFromConfig,
    propsToAttributes,
    StyleSchema,
    wrapInBlockStructure,
} from '@lcw-doc/core'
import { NodeViewWrapper, VueNodeViewRenderer } from '@tiptap/vue-3'
import { Component, computed, defineComponent, h } from 'vue'

import { renderToDOMSpec } from './@util/VueRenderUtil'

export type VueCustomBlockRenderProps<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    block: BlockFromConfig<T, I, S>
    editor: LcwDocEditor<BlockSchemaWithBlock<T['type'], T>, I, S>
    contentRef: (node: HTMLElement | null) => void
}

export type VueCustomBlockImplementation<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    render: Component
    toExternalHTML?: Component
    parse?: (el: HTMLElement) => PartialBlockFromConfig<T, I, S>['props'] | undefined
}

export function createVueBlockSpec<const T extends CustomBlockConfig, const I extends InlineContentSchema, const S extends StyleSchema>(
    blockConfig: T,
    blockImplementation: VueCustomBlockImplementation<T, I, S>
) {
    const UserRenderComponent = blockImplementation.render

    const node = createStronglyTypedTiptapNode({
        name: blockConfig.type as T['type'],
        content: (blockConfig.content === 'inline' ? 'inline*' : '') as T['content'] extends 'inline' ? 'inline*' : '',
        group: 'blockContent',
        selectable: blockConfig.isSelectable ?? true,

        addAttributes() {
            return propsToAttributes(blockConfig.propSchema)
        },

        parseHTML() {
            return getParseRules(blockConfig, blockImplementation.parse)
        },

        renderHTML({ HTMLAttributes }) {
            const div = document.createElement('div')
            return wrapInBlockStructure(
                {
                    dom: div,
                    contentDOM: blockConfig.content === 'inline' ? div : undefined,
                },
                blockConfig.type,
                {},
                blockConfig.propSchema,
                blockConfig.isFileBlock,
                HTMLAttributes
            )
        },

        addNodeView() {
            const WrappingComponent = defineComponent({
                setup(props: any) {
                    const block = computed(() => {
                        try {
                            // Read node prop to establish reactive dependency on updates
                            void props.node

                            const bnEditor = props.extension?.options?.editor as LcwDocEditor<any>
                            const tiptapEditor = props.editor
                            if (!bnEditor) return null
                            return getBlockFromPos(props.getPos, bnEditor, tiptapEditor, blockConfig.type)
                        } catch {
                            return null
                        }
                    })

                    const contentRef = (el: any) => {
                        if (el && !el.hasAttribute('data-node-view-content')) {
                            el.setAttribute('data-node-view-content', '')
                        }
                    }

                    return () => {
                        const b = block.value
                        if (!b) return null

                        const blockContentDOMAttributes = (node.options as any).domAttributes?.blockContent || {}

                        const dataAttrs: Record<string, any> = {}
                        Object.entries(b.props)
                            .filter(([prop, value]) => !inheritedProps.includes(prop) && value !== blockConfig.propSchema[prop].default)
                            .forEach(([prop, value]) => {
                                dataAttrs[camelToDataKebab(prop)] = value
                            })

                        if (blockConfig.isFileBlock) {
                            dataAttrs['data-file-block'] = ''
                        }

                        return h(
                            NodeViewWrapper,
                            {
                                class: mergeCSSClasses('bn-block-content', blockContentDOMAttributes.class || ''),
                                'data-content-type': b.type,
                                ...dataAttrs,
                            },
                            {
                                default: () =>
                                    h(UserRenderComponent, {
                                        block: b,
                                        editor: (b as any).editor || props.extension?.options?.editor,
                                        contentRef,
                                    }),
                            }
                        )
                    }
                },
            })

            const renderer = VueNodeViewRenderer(WrappingComponent as any)
            return (props: any) => {
                const nodeView = renderer(props)
                if (blockConfig.isSelectable === false) {
                    applyNonSelectableBlockFix(nodeView, this.editor)
                }
                return nodeView
            }
        },
    })

    if (node.name !== blockConfig.type) {
        throw new Error('Node name does not match block type. This is a bug in LcwDoc.')
    }

    return createInternalBlockSpec(blockConfig, {
        node,
        toInternalHTML: (block, editor) => {
            const blockContentDOMAttributes = (node.options as any).domAttributes?.blockContent || {}

            const output = renderToDOMSpec(
                refCB =>
                    h(
                        NodeViewWrapper,
                        {
                            class: mergeCSSClasses('bn-block-content', blockContentDOMAttributes.class || ''),
                            'data-content-type': block.type,
                        },
                        {
                            default: () =>
                                h(UserRenderComponent, {
                                    block: block as any,
                                    editor: editor as any,
                                    contentRef: refCB,
                                }),
                        }
                    ),
                editor
            )
            output.contentDOM?.setAttribute('data-editable', '')
            return output
        },
        toExternalHTML: (block, editor) => {
            const blockContentDOMAttributes = (node.options as any).domAttributes?.blockContent || {}

            const ExternalComponent = blockImplementation.toExternalHTML || UserRenderComponent
            const output = renderToDOMSpec(
                refCB =>
                    h(
                        NodeViewWrapper,
                        {
                            class: mergeCSSClasses('bn-block-content', blockContentDOMAttributes.class || ''),
                            'data-content-type': block.type,
                        },
                        {
                            default: () =>
                                h(ExternalComponent, {
                                    block: block as any,
                                    editor: editor as any,
                                    contentRef: refCB,
                                }),
                        }
                    ),
                editor
            )
            output.contentDOM?.setAttribute('data-editable', '')
            return output
        },
    })
}
