import { Node } from 'prosemirror-model'
import { NodeSelection, Selection } from 'prosemirror-state'
import * as pmView from 'prosemirror-view'
import { EditorView } from 'prosemirror-view'

import { createExternalHTMLExporter } from '../../api/exporters/html/externalHTMLExporter'
import { cleanHTMLToMarkdown } from '../../api/exporters/markdown/markdownExporter'
import { fragmentToBlocks } from '../../api/nodeConversions/fragmentToBlocks'
import { Block } from '../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { MultipleNodeSelection } from './MultipleNodeSelection'

let dragImageElement: Element | undefined

export type SideMenuState<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = UiElementPosition & {
    block: Block<BSchema, I, S>
}

export function getDraggableBlockFromElement(element: Element, view: EditorView) {
    while (
        element &&
        element.parentElement &&
        element.parentElement !== view.dom &&
        element.getAttribute?.('data-node-type') !== 'blockContainer'
    ) {
        element = element.parentElement
    }
    if (element.getAttribute?.('data-node-type') !== 'blockContainer') {
        return undefined
    }
    return { node: element as HTMLElement, id: element.getAttribute('data-id')! }
}

function blockPositionFromElement(element: Element, view: EditorView) {
    const block = getDraggableBlockFromElement(element, view)

    if (block && block.node.nodeType === 1) {
        const docView = (view as any).docView
        const desc = docView.nearestDesc(block.node, true)
        if (!desc || desc === docView) {
            return null
        }
        return desc.posBefore
    }
    return null
}

function blockPositionsFromSelection(selection: Selection, doc: Node) {
    let beforeFirstBlockPos: number
    let afterLastBlockPos: number

    const selectionStartInBlockContent = doc.resolve(selection.from).node().type.spec.group === 'blockContent'
    const selectionEndInBlockContent = doc.resolve(selection.to).node().type.spec.group === 'blockContent'
    const minDepth = Math.min(selection.$anchor.depth, selection.$head.depth)

    if (selectionStartInBlockContent && selectionEndInBlockContent) {
        const startFirstBlockPos = selection.$from.start(minDepth - 1)
        const endLastBlockPos = selection.$to.end(minDepth - 1)

        beforeFirstBlockPos = doc.resolve(startFirstBlockPos - 1).pos
        afterLastBlockPos = doc.resolve(endLastBlockPos + 1).pos
    } else {
        beforeFirstBlockPos = selection.from
        afterLastBlockPos = selection.to
    }

    return { from: beforeFirstBlockPos, to: afterLastBlockPos }
}

function setDragImage(view: EditorView, from: number, to = from) {
    if (from === to) {
        to += view.state.doc.resolve(from + 1).node().nodeSize
    }

    const parentClone = view.domAtPos(from).node.cloneNode(true) as Element
    const parent = view.domAtPos(from).node as Element

    const getElementIndex = (parentElement: Element, targetElement: Element) =>
        Array.prototype.indexOf.call(parentElement.children, targetElement)

    const firstSelectedBlockIndex = getElementIndex(parent, view.domAtPos(from + 1).node.parentElement!)
    const lastSelectedBlockIndex = getElementIndex(parent, view.domAtPos(to - 1).node.parentElement!)

    for (let i = parent.childElementCount - 1; i >= 0; i--) {
        if (i > lastSelectedBlockIndex || i < firstSelectedBlockIndex) {
            parentClone.removeChild(parentClone.children[i])
        }
    }

    unsetDragImage(view.root)
    dragImageElement = parentClone

    const classes = view.dom.className.split(' ')
    const inheritedClasses = classes
        .filter(className => className !== 'ProseMirror' && className !== 'bn-root' && className !== 'bn-editor')
        .join(' ')

    dragImageElement.className = dragImageElement.className + ' bn-drag-preview ' + inheritedClasses

    if (view.root instanceof ShadowRoot) {
        view.root.appendChild(dragImageElement)
    } else {
        view.root.body.appendChild(dragImageElement)
    }
}

export function unsetDragImage(rootEl: Document | ShadowRoot) {
    if (dragImageElement !== undefined) {
        if (rootEl instanceof ShadowRoot) {
            rootEl.removeChild(dragImageElement)
        } else {
            rootEl.body.removeChild(dragImageElement)
        }

        dragImageElement = undefined
    }
}

export function dragStart<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    e: { dataTransfer: DataTransfer | null; clientY: number },
    editor: LcwDocEditor<BSchema, I, S>
) {
    if (!e.dataTransfer) {
        return
    }

    const view = editor.prosemirrorView

    const editorBoundingBox = view.dom.getBoundingClientRect()

    const coords = {
        left: editorBoundingBox.left + editorBoundingBox.width / 2,
        top: e.clientY,
    }

    const elements = view.root.elementsFromPoint(coords.left, coords.top)
    let blockEl = undefined

    for (const element of elements) {
        if (view.dom.contains(element)) {
            blockEl = getDraggableBlockFromElement(element, view)
            break
        }
    }

    if (!blockEl) {
        return
    }

    const pos = blockPositionFromElement(blockEl.node, view)
    if (pos != null) {
        const selection = view.state.selection
        const doc = view.state.doc

        const { from, to } = blockPositionsFromSelection(selection, doc)

        const draggedBlockInSelection = from <= pos && pos < to
        const multipleBlocksSelected = selection.$anchor.node() !== selection.$head.node() || selection instanceof MultipleNodeSelection

        if (draggedBlockInSelection && multipleBlocksSelected) {
            view.dispatch(view.state.tr.setSelection(MultipleNodeSelection.create(doc, from, to)))
            setDragImage(view, from, to)
        } else {
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)))
            setDragImage(view, pos)
        }

        const selectedSlice = view.state.selection.content()
        const schema = editor.pmSchema

        const clipboardHTML = (pmView as any).__serializeForClipboard(view, selectedSlice).dom.innerHTML

        const externalHTMLExporter = createExternalHTMLExporter(schema, editor)

        const blocks = fragmentToBlocks(selectedSlice.content, editor.schema)
        const externalHTML = externalHTMLExporter.exportBlocks(blocks, {})

        const plainText = cleanHTMLToMarkdown(externalHTML)

        e.dataTransfer.clearData()
        e.dataTransfer.setData('lcwdoc/html', clipboardHTML)
        e.dataTransfer.setData('text/html', externalHTML)
        e.dataTransfer.setData('text/plain', plainText)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setDragImage(dragImageElement!, 0, 0)
        view.dragging = { slice: selectedSlice, move: true }
    }
}
