import { createReactBlockSpec } from '@lcw-doc/react'
import { useState } from 'react'

export const Embed = createReactBlockSpec(
    {
        type: 'embed',
        propSchema: {
            url: { default: '' },
            title: { default: '' },
        },
        content: 'none',
    },
    {
        render: props => {
            return (
                <EmbedContent
                    url={props.block.props.url || ''}
                    title={props.block.props.title || ''}
                    editor={props.editor}
                    blockId={props.block.id}
                />
            )
        },
    }
)

function EmbedContent({ url, title, editor, blockId }: { url: string; title: string; editor: any; blockId: string }) {
    const [editing, setEditing] = useState(!url)
    const [inputUrl, setInputUrl] = useState(url)

    const handleSave = () => {
        if (inputUrl.trim()) {
            let finalUrl = inputUrl.trim()
            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl
            }
            editor.updateBlock(blockId, { type: 'embed', props: { url: finalUrl, title: title || finalUrl } })
            setEditing(false)
        }
    }

    const handleRemove = () => {
        editor.removeBlocks([{ id: blockId }])
    }

    if (editing || !url) {
        return (
            <div
                style={{
                    padding: '16px',
                    border: '1px dashed #e9e9e7',
                    borderRadius: '8px',
                    backgroundColor: '#fafaf9',
                }}
            >
                <div style={{ fontSize: '13px', color: '#787774', marginBottom: '8px' }}>嵌入网页</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        placeholder="输入网页链接，如 https://example.com"
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSave()
                        }}
                        style={{
                            flex: 1,
                            padding: '6px 10px',
                            border: '1px solid #e9e9e7',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                            backgroundColor: '#fff',
                        }}
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '6px 14px',
                            backgroundColor: '#37352f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        嵌入
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                    fontSize: '12px',
                    color: '#b4b4b0',
                }}
            >
                <span>🔗</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || url}</span>
                <button
                    onClick={() => setEditing(true)}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#b4b4b0',
                        fontSize: '12px',
                        padding: '0 4px',
                    }}
                >
                    编辑
                </button>
                <button
                    onClick={handleRemove}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#b4b4b0',
                        fontSize: '12px',
                        padding: '0 4px',
                    }}
                >
                    删除
                </button>
            </div>
            <div
                style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e9e9e7',
                }}
            >
                <iframe
                    src={url}
                    title={title || url}
                    style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    loading="lazy"
                />
            </div>
        </div>
    )
}
