import { createReactBlockSpec } from '@lcw-doc/react'
import { useState } from 'react'

type ColumnLayout = '2-col' | '3-col' | '2-col-left' | '2-col-right'

const LAYOUT_CONFIG: Record<ColumnLayout, { label: string; cols: number; widths: string[] }> = {
    '2-col': { label: '两栏等宽', cols: 2, widths: ['50%', '50%'] },
    '3-col': { label: '三栏等宽', cols: 3, widths: ['33.33%', '33.33%', '33.33%'] },
    '2-col-left': { label: '左宽右窄', cols: 2, widths: ['66.66%', '33.33%'] },
    '2-col-right': { label: '左窄右宽', cols: 2, widths: ['33.33%', '66.66%'] },
}

export const ColumnLayout = createReactBlockSpec(
    {
        type: 'columnLayout',
        propSchema: {
            layout: { default: '2-col' as ColumnLayout, values: ['2-col', '3-col', '2-col-left', '2-col-right'] as ColumnLayout[] },
        },
        content: 'none',
    },
    {
        render: props => {
            const layout = (props.block.props.layout || '2-col') as ColumnLayout
            return <ColumnLayoutContent layout={layout} editor={props.editor} blockId={props.block.id} />
        },
    }
)

function ColumnLayoutContent({ layout, editor, blockId }: { layout: ColumnLayout; editor: any; blockId: string }) {
    const [showMenu, setShowMenu] = useState(false)
    const config = LAYOUT_CONFIG[layout]

    const handleLayoutChange = (newLayout: ColumnLayout) => {
        editor.updateBlock(blockId, { type: 'columnLayout', props: { layout: newLayout } })
        setShowMenu(false)
    }

    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '4px 0',
                }}
            >
                {config.widths.map((width, i) => (
                    <div
                        key={i}
                        style={{
                            width,
                            minHeight: '60px',
                            border: '1px dashed #e9e9e7',
                            borderRadius: '4px',
                            padding: '8px',
                            backgroundColor: '#fafaf9',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#b4b4b0',
                                textAlign: 'center',
                                padding: '16px 0',
                            }}
                        >
                            栏 {i + 1}
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    color: '#b4b4b0',
                    fontSize: '14px',
                }}
                onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = '#f7f6f3'
                    ;(e.currentTarget as HTMLElement).style.color = '#787774'
                }}
                onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = '#b4b4b0'
                }}
            >
                ⋯
            </button>
            {showMenu && (
                <div
                    style={{
                        position: 'absolute',
                        top: '28px',
                        right: '0',
                        zIndex: 100,
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #e9e9e7',
                        padding: '4px',
                        minWidth: '140px',
                    }}
                >
                    {(Object.entries(LAYOUT_CONFIG) as [ColumnLayout, typeof config][]).map(([key, cfg]) => (
                        <div
                            key={key}
                            onClick={() => handleLayoutChange(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#37352f',
                                backgroundColor: key === layout ? '#f7f6f3' : 'transparent',
                            }}
                            onMouseEnter={e => {
                                if (key !== layout) (e.currentTarget as HTMLElement).style.backgroundColor = '#f7f6f3'
                            }}
                            onMouseLeave={e => {
                                if (key !== layout) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                            }}
                        >
                            <LayoutIcon layout={key} />
                            <span>{cfg.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function LayoutIcon({ layout }: { layout: ColumnLayout }) {
    const configs: Record<ColumnLayout, string[]> = {
        '2-col': ['50%', '50%'],
        '3-col': ['33%', '33%', '33%'],
        '2-col-left': ['66%', '33%'],
        '2-col-right': ['33%', '66%'],
    }
    return (
        <div style={{ display: 'flex', gap: '2px', width: '24px' }}>
            {configs[layout].map((w, i) => (
                <div
                    key={i}
                    style={{
                        width: w,
                        height: '12px',
                        backgroundColor: '#e9e9e7',
                        borderRadius: '2px',
                    }}
                />
            ))}
        </div>
    )
}
