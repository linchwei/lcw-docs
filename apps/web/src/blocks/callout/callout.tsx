import { createReactBlockSpec } from '@lcw-doc/react'
import { useCallback, useState } from 'react'

const CALLOUT_CONFIG = {
    info: { icon: '💡', bg: '#eef4fc', color: '#097fe8', label: '信息' },
    warning: { icon: '⚠️', bg: '#fbf3db', color: '#cb912f', label: '警告' },
    error: { icon: '❌', bg: '#fbe4e4', color: '#eb5757', label: '错误' },
    success: { icon: '✅', bg: '#dbeddb', color: '#4dab6f', label: '成功' },
}

type CalloutType = keyof typeof CALLOUT_CONFIG

export const Callout = createReactBlockSpec(
    {
        type: 'callout',
        propSchema: {
            calloutType: { default: 'info', values: ['info', 'warning', 'error', 'success'] },
        },
        content: 'inline',
    },
    {
        render: props => {
            const calloutType = (props.block.props.calloutType || 'info') as CalloutType

            return (
                <CalloutContent
                    calloutType={calloutType}
                    editor={props.editor}
                    blockId={props.block.id}
                    contentRef={props.contentRef}
                />
            )
        },
    }
)

function CalloutContent({ calloutType, editor, blockId, contentRef }: {
    calloutType: CalloutType
    editor: any
    blockId: string
    contentRef: any
}) {
    const [showMenu, setShowMenu] = useState(false)
    const config = CALLOUT_CONFIG[calloutType]

    const handleTypeChange = useCallback((type: CalloutType) => {
        editor.updateBlock(blockId, { type: 'callout', props: { calloutType: type } })
        setShowMenu(false)
    }, [editor, blockId])

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: config.bg,
            borderRadius: '4px',
            border: `1px solid ${config.color}22`,
            position: 'relative',
        }}>
            <span
                style={{
                    fontSize: '18px',
                    lineHeight: '24px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => setShowMenu(!showMenu)}
            >
                {config.icon}
            </span>
            <div ref={contentRef} style={{ flex: 1, outline: 'none' }} />
            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '12px',
                    zIndex: 100,
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e9e9e7',
                    padding: '4px',
                    minWidth: '120px',
                }}>
                    {(Object.entries(CALLOUT_CONFIG) as [CalloutType, typeof config][]).map(([type, cfg]) => (
                        <div
                            key={type}
                            onClick={() => handleTypeChange(type)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#37352f',
                                backgroundColor: type === calloutType ? '#f7f6f3' : 'transparent',
                            }}
                            onMouseEnter={e => {
                                if (type !== calloutType) (e.currentTarget as HTMLElement).style.backgroundColor = '#f7f6f3'
                            }}
                            onMouseLeave={e => {
                                if (type !== calloutType) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                            }}
                        >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
