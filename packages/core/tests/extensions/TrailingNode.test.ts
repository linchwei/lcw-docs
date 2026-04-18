import { describe, test, expect } from 'vitest'
import { Plugin, PluginKey } from 'prosemirror-state'
import { TrailingNode } from '../../src/extensions/TrailingNode/TrailingNodeExtension'

function createTrailingNodePlugin() {
    const pluginKey = new PluginKey('trailingNode')

    return new Plugin({
        key: pluginKey,
        appendTransaction: (_, __, state) => {
            const { doc, tr, schema } = state
            const shouldInsertNodeAtEnd = pluginKey.getState(state)
            const endPosition = doc.content.size - 2
            const type = schema.nodes['blockContainer']
            const contentType = schema.nodes['paragraph']
            if (!shouldInsertNodeAtEnd) {
                return
            }

            return tr.insert(endPosition, type.create(undefined, contentType.create()))
        },
        state: {
            init: () => {},
            apply: (tr, value) => {
                if (!tr.docChanged) {
                    return value
                }

                let lastNode = tr.doc.lastChild

                if (!lastNode || lastNode.type.name !== 'blockGroup') {
                    throw new Error('Expected blockGroup')
                }

                lastNode = lastNode.lastChild

                if (!lastNode || lastNode.type.name !== 'blockContainer') {
                    throw new Error('Expected blockContainer')
                }

                const lastContentNode = lastNode.firstChild

                if (!lastContentNode) {
                    throw new Error('Expected blockContent')
                }

                return lastNode.nodeSize > 4 || lastContentNode.type.spec.content !== 'inline*'
            },
        },
    })
}

describe('TrailingNode Extension', () => {
    describe('extension configuration', () => {
        test('should have correct name', () => {
            const extension = TrailingNode.configure()
            expect(extension.name).toBe('trailingNode')
        })

        test('should accept custom node option', () => {
            const extension = TrailingNode.configure({ node: 'customNode' })
            expect(extension.options.node).toBe('customNode')
        })

        test('should accept paragraph as node option', () => {
            const extension = TrailingNode.configure({ node: 'paragraph' })
            expect(extension.options.node).toBe('paragraph')
        })
    })

    describe('TrailingNodeOptions interface', () => {
        test('should configure with options object', () => {
            const extension = TrailingNode.configure({ node: 'heading' })
            expect(extension.options).toBeDefined()
            expect(extension.options.node).toBe('heading')
        })

        test('should allow overriding node option', () => {
            const extension = TrailingNode.configure({ node: 'heading' })
            expect(extension.options.node).toBe('heading')
        })
    })
})

describe('TrailingNode Plugin', () => {
    describe('plugin structure', () => {
        test('should create a plugin with a key', () => {
            const plugin = createTrailingNodePlugin()
            expect(plugin.spec).toHaveProperty('key')
        })

        test('should have appendTransaction', () => {
            const plugin = createTrailingNodePlugin()
            expect(typeof plugin.spec.appendTransaction).toBe('function')
        })

        test('should have state with init and apply', () => {
            const plugin = createTrailingNodePlugin()
            expect(plugin.spec.state).toBeDefined()
            expect(typeof plugin.spec.state!.init).toBe('function')
            expect(typeof plugin.spec.state!.apply).toBe('function')
        })
    })

    describe('plugin state apply logic', () => {
        test('should return previous value when document has not changed', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: false,
                doc: {},
            } as any

            const result = applyFn(mockTr, false as any, {} as any, {} as any)
            expect(result).toBe(false)
        })

        test('should return previous value when docChanged is false', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: false,
                doc: {},
            } as any

            const result = applyFn(mockTr, true as any, {} as any, {} as any)
            expect(result).toBe(true)
        })

        test('should throw error when lastChild is not blockGroup', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'paragraph' },
                    },
                },
            } as any

            expect(() => applyFn(mockTr, undefined, {} as any, {} as any)).toThrow('Expected blockGroup')
        })

        test('should throw error when blockGroup lastChild is not blockContainer', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'paragraph' },
                        },
                    },
                },
            } as any

            expect(() => applyFn(mockTr, undefined, {} as any, {} as any)).toThrow('Expected blockContainer')
        })

        test('should throw error when blockContainer has no firstChild', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            firstChild: null,
                        },
                    },
                },
            } as any

            expect(() => applyFn(mockTr, undefined, {} as any, {} as any)).toThrow('Expected blockContent')
        })

        test('should return true when lastNode has content (nodeSize > 4)', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            nodeSize: 10,
                            firstChild: {
                                type: {
                                    name: 'paragraph',
                                    spec: { content: 'inline*' },
                                },
                            },
                        },
                    },
                },
            } as any

            const result = applyFn(mockTr, undefined, {} as any, {} as any)
            expect(result).toBe(true)
        })

        test('should return true when lastContentNode is not inline content type', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            nodeSize: 2,
                            firstChild: {
                                type: {
                                    name: 'codeBlock',
                                    spec: { content: 'text*' },
                                },
                            },
                        },
                    },
                },
            } as any

            const result = applyFn(mockTr, undefined, {} as any, {} as any)
            expect(result).toBe(true)
        })

        test('should return false when lastNode is empty and content type is inline*', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            nodeSize: 4,
                            firstChild: {
                                type: {
                                    name: 'paragraph',
                                    spec: { content: 'inline*' },
                                },
                            },
                        },
                    },
                },
            } as any

            const result = applyFn(mockTr, undefined, {} as any, {} as any)
            expect(result).toBe(false)
        })

        test('should return true when nodeSize equals 4 but content is not inline*', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            nodeSize: 4,
                            firstChild: {
                                type: {
                                    name: 'image',
                                    spec: { content: 'none' },
                                },
                            },
                        },
                    },
                },
            } as any

            const result = applyFn(mockTr, undefined, {} as any, {} as any)
            expect(result).toBe(true)
        })

        test('should return true when nodeSize is 5 with inline* content', () => {
            const plugin = createTrailingNodePlugin()
            const applyFn = plugin.spec.state!.apply

            const mockTr = {
                docChanged: true,
                doc: {
                    lastChild: {
                        type: { name: 'blockGroup' },
                        lastChild: {
                            type: { name: 'blockContainer' },
                            nodeSize: 5,
                            firstChild: {
                                type: {
                                    name: 'paragraph',
                                    spec: { content: 'inline*' },
                                },
                            },
                        },
                    },
                },
            } as any

            const result = applyFn(mockTr, undefined, {} as any, {} as any)
            expect(result).toBe(true)
        })
    })

    describe('plugin state init', () => {
        test('init function should be callable without error', () => {
            const plugin = createTrailingNodePlugin()
            const initFn = plugin.spec.state!.init

            expect(() => initFn!({} as any, {} as any)).not.toThrow()
        })
    })
})
