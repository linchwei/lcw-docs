import { createReactInlineContentSpec } from '@lcw-doc/react'

import { MentionContent } from './MentionContent'

// The Mention inline content.
export const Mention = createReactInlineContentSpec(
    {
        type: 'mention',
        propSchema: {
            id: {
                default: 'Unknown',
            },
            title: {
                default: '',
            },
            icon: {
                default: '',
            },
        },
        content: 'none',
    },
    {
        render: props => {
            const { id, title, icon } = props.inlineContent.props
            return <MentionContent pageId={id} title={title} icon={icon} />
        },
    }
)
