import {
    addInlineContentAttributes,
    addInlineContentKeyboardShortcuts,
    camelToDataKebab,
    createInternalInlineContentSpec,
    createStronglyTypedTiptapNode,
    CustomInlineContentConfig,
    getInlineContentParseRules,
    InlineContentFromConfig,
    inlineContentToNodes,
    nodeToCustomInlineContent,
    Props,
    propsToAttributes,
    StyleSchema,
} from '@lcw-doc/core'
import { NodeViewWrapper, VueNodeViewRenderer } from '@tiptap/vue-3'
import { Component, defineComponent, h } from 'vue'

import { renderToDOMSpec } from './@util/VueRenderUtil'

export type VueInlineContentImplementation<_T extends CustomInlineContentConfig, _S extends StyleSchema> = {
    render: Component
}

export function createVueInlineContentSpec<T extends CustomInlineContentConfig, S extends StyleSchema>(
    inlineContentConfig: T,
    inlineContentImplementation: VueInlineContentImplementation<T, S>
) {
    const node = createStronglyTypedTiptapNode({
        name: inlineContentConfig.type as T['type'],
        inline: true,
        group: 'inline',
        selectable: inlineContentConfig.content === 'styled',
        atom: inlineContentConfig.content === 'none',
        content: (inlineContentConfig.content === 'styled' ? 'inline*' : '') as T['content'] extends 'styled' ? 'inline*' : '',

        addAttributes() {
            return propsToAttributes(inlineContentConfig.propSchema)
        },

        addKeyboardShortcuts() {
            return addInlineContentKeyboardShortcuts(inlineContentConfig)
        },

        parseHTML() {
            return getInlineContentParseRules(inlineContentConfig)
        },

        renderHTML({ node: pmNode }) {
            const editor = this.options.editor

            const ic = nodeToCustomInlineContent(
                pmNode,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            ) as any as InlineContentFromConfig<T, S>

            const Content = inlineContentImplementation.render
            const output = renderToDOMSpec(
                refCB =>
                    h(Content, {
                        inlineContent: ic,
                        updateInlineContent: () => {
                            // No-op for static HTML
                        },
                        contentRef: refCB,
                    }),
                editor
            )

            return addInlineContentAttributes(
                output,
                inlineContentConfig.type,
                pmNode.attrs as Props<T['propSchema']>,
                inlineContentConfig.propSchema
            )
        },

        addNodeView() {
            const editor = this.options.editor

            const WrappingComponent = defineComponent({
                setup(props: any) {
                    return () => {
                        const Content = inlineContentImplementation.render
                        const contentRef = (el: any) => {
                            if (el && !el.hasAttribute('data-node-view-content')) {
                                el.setAttribute('data-node-view-content', '')
                            }
                        }

                        return h(
                            NodeViewWrapper,
                            {
                                as: 'span',
                                class: 'bn-inline-content-section',
                                'data-inline-content-type': inlineContentConfig.type,
                                ...Object.fromEntries(
                                    Object.entries(props.node?.attrs || {})
                                        .filter(([prop, value]) => value !== inlineContentConfig.propSchema[prop]?.default)
                                        .map(([prop, value]) => {
                                            return [camelToDataKebab(prop), value]
                                        })
                                ),
                            },
                            {
                                default: () =>
                                    h(Content, {
                                        contentRef,
                                        inlineContent: nodeToCustomInlineContent(
                                            props.node,
                                            editor.schema.inlineContentSchema,
                                            editor.schema.styleSchema
                                        ) as any as InlineContentFromConfig<T, S>,
                                        updateInlineContent: (update: any) => {
                                            const content = inlineContentToNodes(
                                                [update],
                                                editor._tiptapEditor.schema,
                                                editor.schema.styleSchema
                                            )

                                            editor._tiptapEditor.view.dispatch(
                                                editor._tiptapEditor.view.state.tr.replaceWith(
                                                    props.getPos(),
                                                    props.getPos() + props.node.nodeSize,
                                                    content
                                                )
                                            )
                                        },
                                    }),
                            }
                        )
                    }
                },
            })

            return VueNodeViewRenderer(WrappingComponent as any)
        },
    })

    return createInternalInlineContentSpec(inlineContentConfig, {
        node: node,
    } as any)
}
