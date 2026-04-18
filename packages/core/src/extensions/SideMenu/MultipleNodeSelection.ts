import { Fragment, Node, ResolvedPos, Slice } from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import { Mappable } from 'prosemirror-transform'

export class MultipleNodeSelection extends Selection {
    nodes: Array<Node>

    constructor($anchor: ResolvedPos, $head: ResolvedPos) {
        super($anchor, $head)

        const parentNode = $anchor.node()

        this.nodes = []
        $anchor.doc.nodesBetween($anchor.pos, $head.pos, (node, _pos, parent) => {
            if (parent !== null && parent.eq(parentNode)) {
                this.nodes.push(node)
                return false
            }
            return
        })
    }

    static create(doc: Node, from: number, to = from): MultipleNodeSelection {
        return new MultipleNodeSelection(doc.resolve(from), doc.resolve(to))
    }

    content(): Slice {
        return new Slice(Fragment.from(this.nodes), 0, 0)
    }

    eq(selection: Selection): boolean {
        if (!(selection instanceof MultipleNodeSelection)) {
            return false
        }

        if (this.nodes.length !== selection.nodes.length) {
            return false
        }

        if (this.from !== selection.from || this.to !== selection.to) {
            return false
        }

        for (let i = 0; i < this.nodes.length; i++) {
            if (!this.nodes[i].eq(selection.nodes[i])) {
                return false
            }
        }

        return true
    }

    map(doc: Node, mapping: Mappable): Selection {
        const fromResult = mapping.mapResult(this.from)
        const toResult = mapping.mapResult(this.to)

        if (toResult.deleted) {
            return Selection.near(doc.resolve(fromResult.pos))
        }

        if (fromResult.deleted) {
            return Selection.near(doc.resolve(toResult.pos))
        }

        return new MultipleNodeSelection(doc.resolve(fromResult.pos), doc.resolve(toResult.pos))
    }

    toJSON(): any {
        return { type: 'node', anchor: this.anchor, head: this.head }
    }
}
