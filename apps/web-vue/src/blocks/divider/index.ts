import { createVueBlockSpec } from '@lcw-doc/vue'
import { defineComponent, h } from 'vue'

export const Divider = createVueBlockSpec(
    {
        type: 'divider',
        propSchema: {},
        content: 'none',
    },
    {
        render: defineComponent({
            setup() {
                return () =>
                    h(
                        'div',
                        { style: { padding: '8px 0' } },
                        h('hr', {
                            style: {
                                border: 'none',
                                borderTop: '1px solid #e9e9e7',
                                margin: 0,
                            },
                        }),
                    )
            },
        }),
    },
)
