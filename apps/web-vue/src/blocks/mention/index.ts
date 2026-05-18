import { createVueInlineContentSpec } from '@lcw-doc/vue'

import MentionContent from './MentionContent.vue'

export const Mention = createVueInlineContentSpec(
    {
        type: 'mention',
        propSchema: {
            id: { default: 'Unknown' },
            title: { default: '' },
            icon: { default: '' },
        },
        content: 'none',
    },
    {
        render: MentionContent,
    }
)
