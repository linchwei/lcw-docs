import { createStyleSpecFromTipTapMark } from '@lcw-doc/core'
import { Mark, markInputRule, markPasteRule, mergeAttributes } from '@tiptap/core'

const HighlightMarkImpl = Mark.create({
    name: 'highlight',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    parseHTML() {
        return [
            { tag: 'mark' },
            { tag: 'span[data-style-type="highlight"]' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },

    addInputRules() {
        return [
            markInputRule({
                find: /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/,
                type: this.type,
            }),
        ]
    },

    addPasteRules() {
        return [
            markPasteRule({
                find: /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g,
                type: this.type,
            }),
        ]
    },
})

export const Highlight = createStyleSpecFromTipTapMark(HighlightMarkImpl, 'boolean')

const SuperscriptMarkImpl = Mark.create({
    name: 'superscript',

    parseHTML() {
        return [
            { tag: 'sup' },
            { tag: 'span[data-style-type="superscript"]' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['sup', mergeAttributes(HTMLAttributes), 0]
    },

    addInputRules() {
        return [
            markInputRule({
                find: /(\^(?!\s+\^)((?:[^\^]+))\^(?!\s+\^))$/,
                type: this.type,
            }),
        ]
    },

    addPasteRules() {
        return [
            markPasteRule({
                find: /(\^(?!\s+\^)((?:[^\^]+))\^(?!\s+\^))/g,
                type: this.type,
            }),
        ]
    },
})

export const Superscript = createStyleSpecFromTipTapMark(SuperscriptMarkImpl, 'boolean')

const SubscriptMarkImpl = Mark.create({
    name: 'subscript',

    parseHTML() {
        return [
            { tag: 'sub' },
            { tag: 'span[data-style-type="subscript"]' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['sub', mergeAttributes(HTMLAttributes), 0]
    },

    addInputRules() {
        return [
            markInputRule({
                find: /(?<!~)(~(?!\s+~)((?:[^~]+))~(?!\s+~))$/,
                type: this.type,
            }),
        ]
    },

    addPasteRules() {
        return [
            markPasteRule({
                find: /(?<!~)(~(?!\s+~)((?:[^~]+))~(?!\s+~))/g,
                type: this.type,
            }),
        ]
    },
})

export const Subscript = createStyleSpecFromTipTapMark(SubscriptMarkImpl, 'boolean')
