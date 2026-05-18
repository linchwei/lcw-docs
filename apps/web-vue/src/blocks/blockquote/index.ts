import { createVueBlockSpec } from '@lcw-doc/vue'
import { defineComponent, h } from 'vue'

export const Blockquote = createVueBlockSpec(
    {
        type: 'blockquote',
        propSchema: {},
        content: 'inline',
    },
    {
        render: defineComponent({
            props: ['block', 'editor', 'contentRef'],
            setup(props) {
                return () =>
                    h(
                        'div',
                        {
                            style: {
                                borderLeft: '3px solid #e9e9e7',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                backgroundColor: '#f7f6f3',
                                borderRadius: '0 4px 4px 0',
                                color: '#787774',
                                fontStyle: 'italic',
                            },
                        },
                        [h('div', { ref: props.contentRef })]
                    )
            },
        }),
    }
)
