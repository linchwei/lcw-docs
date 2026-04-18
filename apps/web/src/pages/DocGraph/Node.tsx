import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { Handle, NodeProps, Position } from '@xyflow/react'
import { memo, useMemo } from 'react'

interface GraphNodeProps extends NodeProps {
    data: {
        emoji: string
        title: string
    }
}

const stableColor = (str: string) => {
    const colors = [
        'rgb(254, 226, 226)',
        'rgb(224, 242, 254)',
        'rgb(209, 250, 229)',
        'rgb(236, 252, 203)',
        'rgb(243, 232, 255)',
        'rgb(254, 243, 199)',
        'rgb(226, 232, 240)',
        'rgb(251, 233, 237)',
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

export const GraphNode = memo((props: GraphNodeProps) => {
    const { data, selected } = props
    const color = useMemo(() => stableColor(data.emoji || data.title || ''), [data.emoji, data.title])

    return (
        <div className="w-full h-full cursor-pointer" title={data.title}>
            <Handle type="target" position={Position.Left} className="invisible bg-transparent" style={{ left: '50%' }} />
            <div className="flex flex-col justify-center items-center w-full pt-[28px]">
                <div
                    className={cn(
                        'flex items-center justify-center text-xl size-[40px] mb-1.5 rounded-full transition-all duration-200',
                        selected
                            ? 'border-2 border-blue-400 scale-125 shadow-md shadow-blue-100'
                            : 'hover:scale-110 hover:shadow-sm'
                    )}
                    style={{ backgroundColor: color }}
                >
                    {data.emoji}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2 text-center max-w-[100px] leading-tight">{data.title}</p>
            </div>
            <Handle type="source" position={Position.Left} className="invisible bg-transparent" style={{ left: '50%' }} />
        </div>
    )
})
