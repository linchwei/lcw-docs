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
    PartialCustomInlineContentFromConfig,
    Props,
    PropSchema,
    propsToAttributes,
    StyleSchema,
} from '@lcw-doc/core'
import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer, useReactNodeView } from '@tiptap/react'
import { FC, ReactElement } from 'react'

import { renderToDOMSpec } from './@util/ReactRenderUtil'

export type ReactInlineContentImplementation<T extends CustomInlineContentConfig, S extends StyleSchema> = {
    render: FC<{
        inlineContent: InlineContentFromConfig<T, S>
        updateInlineContent: (update: PartialCustomInlineContentFromConfig<T, S>) => void
        contentRef: (node: HTMLElement | null) => void
    }>
}

export function InlineContentWrapper<IType extends string, PSchema extends PropSchema>(props: {
    children: ReactElement
    inlineContentType: IType
    inlineContentProps: Props<PSchema>
    propSchema: PSchema
}) {
    return (
        <NodeViewWrapper
            as={'span'}
            className={'bn-inline-content-section'}
            data-inline-content-type={props.inlineContentType}
            {...Object.fromEntries(
                Object.entries(props.inlineContentProps)
                    .filter(([prop, value]) => value !== props.propSchema[prop].default)
                    .map(([prop, value]) => {
                        return [camelToDataKebab(prop), value]
                    })
            )}
        >
            {props.children}
        </NodeViewWrapper>
    )
}

export function createReactInlineContentSpec<T extends CustomInlineContentConfig, S extends StyleSchema>(
    inlineContentConfig: T,
    inlineContentImplementation: ReactInlineContentImplementation<T, S>
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

        renderHTML({ node }) {
            const editor = this.options.editor

            const ic = nodeToCustomInlineContent(
                node,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            ) as any as InlineContentFromConfig<T, S>
            const Content = inlineContentImplementation.render
            const output = renderToDOMSpec(
                refCB => (
                    <Content
                        inlineContent={ic}
                        updateInlineContent={() => {
                            // No-op
                        }}
                        contentRef={refCB}
                    />
                ),
                editor
            )

            return addInlineContentAttributes(
                output,
                inlineContentConfig.type,
                node.attrs as Props<T['propSchema']>,
                inlineContentConfig.propSchema
            )
        },

        addNodeView() {
            const editor = this.options.editor
            return props =>
                ReactNodeViewRenderer(
                    (props: NodeViewProps) => {
                        const { nodeViewContentRef: ref } = useReactNodeView()

                        const Content = inlineContentImplementation.render
                        return (
                            <InlineContentWrapper
                                inlineContentProps={props.node.attrs as Props<T['propSchema']>}
                                inlineContentType={inlineContentConfig.type}
                                propSchema={inlineContentConfig.propSchema}
                            >
                                <Content
                                    contentRef={ref!}
                                    inlineContent={
                                        nodeToCustomInlineContent(
                                            props.node,
                                            editor.schema.inlineContentSchema,
                                            editor.schema.styleSchema
                                        ) as any as InlineContentFromConfig<T, S>
                                    }
                                    updateInlineContent={update => {
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
                                    }}
                                />
                            </InlineContentWrapper>
                        )
                    },
                    {
                        className: 'bn-ic-react-node-view-renderer',
                        as: 'span',
                    }
                )(props)
        },
    })

    return createInternalInlineContentSpec(inlineContentConfig, {
        node: node,
    } as any)
}
