import { createReactBlockSpec } from '@lcw-doc/react'
export const Divider = createReactBlockSpec(
    {
        type: 'divider',
        propSchema: {},
        content: 'none',
    },
    {
        render: props => {
            return (
                <div style={{ padding: '8px 0' }}>
                    <hr style={{
                        border: 'none',
                        borderTop: '1px solid #e9e9e7',
                        margin: 0,
                    }} />
                </div>
            )
        },
    }
)
