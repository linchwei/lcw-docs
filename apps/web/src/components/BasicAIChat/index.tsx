import { LcwDocEditor } from '@lcw-doc/core'
// import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import PubSub from 'pubsub-js'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import { useClickOutside } from '@/hooks/use-click-outside'

import { BasicAIChatPanel } from './BasicAIChatPanel'

interface BasicAIChatProps {
    editor: LcwDocEditor
}

export function BasicAIChat(props: BasicAIChatProps) {
    const { editor } = props
    const [currentAIPoweredParagraphBlockId, setCurrentAIPoweredParagraphBlockId] = useState<string | null>()
    const ref = useClickOutside(() => setCurrentAIPoweredParagraphBlockId(null))

    useEffect(() => {
        PubSub.subscribe('ai-inserted', (_, blockId) => {
            setCurrentAIPoweredParagraphBlockId(blockId)
        })

        return () => {
            PubSub.unsubscribe('ai-inserted')
        }
    }, [])

    if (currentAIPoweredParagraphBlockId) {
        const dom = document.querySelector(`[data-id="${currentAIPoweredParagraphBlockId}"]`)
        if (!dom) {
            return null
        }
        const { left, bottom, width } = dom.getBoundingClientRect()
        const { scrollY } = window

        const styles: React.CSSProperties = {
            outline: 'none',
            position: 'absolute',
            left,
            top: bottom + scrollY,
            width,
        }

        return ReactDOM.createPortal(
            <div style={styles} tabIndex={-1} ref={ref}>
                {/* <Button
                    onClick={() =>
                        editor.replaceBlocks(
                            [currentAIPoweredParagraphBlockId],
                            // [
                            //     {
                            //         type: 'paragraph',
                            //         content: [
                            //             {
                            //                 type: 'text',
                            //                 text: '这是一个新的段落',
                            //                 styles: {},
                            //             },
                            //         ],
                            //     },
                            // ]
                            [
                                {
                                    id: '5f87279e-95fb-48be-a12f-08e5e7df08a8',
                                    type: 'paragraph',
                                    props: {
                                        textColor: 'default',
                                        backgroundColor: 'default',
                                        textAlignment: 'left',
                                    },
                                    content: [
                                        {
                                            type: 'text',
                                            text: '阿',
                                            styles: {},
                                        },
                                        {
                                            type: 'text',
                                            text: '斯顿发',
                                            styles: {
                                                bold: true,
                                            },
                                        },
                                    ],
                                    children: [],
                                },
                            ]
                        )
                    }
                >
                    追加内容
                </Button> */}
                <BasicAIChatPanel
                    editor={editor}
                    onResponse={blocks => {
                        editor.replaceBlocks([currentAIPoweredParagraphBlockId], blocks)
                        setCurrentAIPoweredParagraphBlockId(null)
                    }}
                />
            </div>,
            document.body
        )
    }

    return null
}
