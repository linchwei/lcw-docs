import { Extension, InputRule } from '@tiptap/core'

export const LinkInputRule = Extension.create({
    name: 'linkInputRule',

    addInputRules() {
        return [
            new InputRule({
                find: /(?:^|\s)(\[([^\]]+)\]\(([^)]+)\))$/,
                handler: ({ state, range, match, chain }) => {
                    const fullMatch = match[0]
                    const text = match[2]
                    const url = match[3]
                    const start = range.from
                    const end = range.to

                    const spacePrefix = fullMatch.startsWith(' ') ? 1 : 0
                    const linkStart = start + spacePrefix
                    const linkEnd = end

                    if (state.schema.marks.link) {
                        chain()
                            .deleteRange({ from: linkStart, to: linkEnd })
                            .insertContentAt(linkStart, state.schema.text(text, [
                                state.schema.marks.link.create({ href: url }),
                            ]))
                            .run()
                    }
                },
            }),
        ]
    },
})
