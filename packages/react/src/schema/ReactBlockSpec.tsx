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
    mergeCSSClasses,
    LcwDocEditor,
    PartialBlockFromConfig,
    Props,
    PropSchema,
    propsToAttributes,
    StyleSchema,
    wrapInBlockStructure,
} from '@lcw-doc/core'
import { NodeView, NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer, useReactNodeView } from '@tiptap/react'
import { FC, ReactNode } from 'react'

import { renderToDOMSpec } from './@util/ReactRenderUtil'

export type ReactCustomBlockRenderProps<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    block: BlockFromConfig<T, I, S>
    editor: LcwDocEditor<BlockSchemaWithBlock<T['type'], T>, I, S>
    contentRef: (node: HTMLElement | null) => void
}

export type ReactCustomBlockImplementation<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    render: FC<ReactCustomBlockRenderProps<T, I, S>>
    toExternalHTML?: FC<ReactCustomBlockRenderProps<T, I, S>>
    parse?: (el: HTMLElement) => PartialBlockFromConfig<T, I, S>['props'] | undefined
}

export function BlockContentWrapper<BType extends string, PSchema extends PropSchema>(props: {
    blockType: BType
    blockProps: Props<PSchema>
    propSchema: PSchema
    isFileBlock?: boolean
    domAttributes?: Record<string, string>
    children: ReactNode
}) {
    return (
        <NodeViewWrapper
            {...Object.fromEntries(Object.entries(props.domAttributes || {}).filter(([key]) => key !== 'class'))}
            className={mergeCSSClasses('bn-block-content', props.domAttributes?.class || '')}
            data-content-type={props.blockType}
            {...Object.fromEntries(
                Object.entries(props.blockProps)
                    .filter(([prop, value]) => !inheritedProps.includes(prop) && value !== props.propSchema[prop].default)
                    .map(([prop, value]) => {
                        return [camelToDataKebab(prop), value]
                    })
            )}
            data-file-block={props.isFileBlock === true || undefined}
        >
            {props.children}
        </NodeViewWrapper>
    )
}

export function createReactBlockSpec<const T extends CustomBlockConfig, const I extends InlineContentSchema, const S extends StyleSchema>(
    blockConfig: T,
    blockImplementation: ReactCustomBlockImplementation<T, I, S>
) {
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
            return props => {
                const nodeView = ReactNodeViewRenderer(
                    (props: NodeViewProps) => {
                        const editor = this.options.editor! as LcwDocEditor<any>
                        const block = getBlockFromPos(props.getPos, editor, this.editor, blockConfig.type) as any
                        const blockContentDOMAttributes = this.options.domAttributes?.blockContent || {}
                        const { nodeViewContentRef: ref } = useReactNodeView()

                        const BlockContent = blockImplementation.render
                        return (
                            <BlockContentWrapper
                                blockType={block.type}
                                blockProps={block.props}
                                propSchema={blockConfig.propSchema}
                                isFileBlock={blockConfig.isFileBlock}
                                domAttributes={blockContentDOMAttributes}
                            >
                                <BlockContent block={block as any} editor={editor as any} contentRef={ref!} />
                            </BlockContentWrapper>
                        )
                    },
                    {
                        className: 'bn-react-node-view-renderer',
                    }
                )(props) as NodeView<any>

                if (blockConfig.isSelectable === false) {
                    applyNonSelectableBlockFix(nodeView, this.editor)
                }

                return nodeView
            }
        },
    })

    return createInternalBlockSpec(blockConfig, {
        node: node,
        toInternalHTML: (block, editor) => {
            const blockContentDOMAttributes = node.options.domAttributes?.blockContent || {}

            const BlockContent = blockImplementation.render
            const output = renderToDOMSpec(
                refCB => (
                    <BlockContentWrapper
                        blockType={block.type}
                        blockProps={block.props}
                        propSchema={blockConfig.propSchema}
                        domAttributes={blockContentDOMAttributes}
                    >
                        <BlockContent block={block as any} editor={editor as any} contentRef={refCB} />
                    </BlockContentWrapper>
                ),
                editor
            )
            output.contentDOM?.setAttribute('data-editable', '')

            return output
        },
        toExternalHTML: (block, editor) => {
            const blockContentDOMAttributes = node.options.domAttributes?.blockContent || {}

            const BlockContent = blockImplementation.toExternalHTML || blockImplementation.render
            const output = renderToDOMSpec(refCB => {
                return (
                    <BlockContentWrapper
                        blockType={block.type}
                        blockProps={block.props}
                        propSchema={blockConfig.propSchema}
                        domAttributes={blockContentDOMAttributes}
                    >
                        <BlockContent block={block as any} editor={editor as any} contentRef={refCB} />
                    </BlockContentWrapper>
                )
            }, editor)
            output.contentDOM?.setAttribute('data-editable', '')

            return output
        },
    })
}
