import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react'
import { memo } from 'react'

export const GraphEdge = memo((props: EdgeProps) => {
    const { id, selected, sourceX, sourceY, targetX, targetY } = props
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    })

    const edgeStyle = {
        strokeStyle: selected ? 'solid' : 'dashed',
        strokeDasharray: selected ? '0' : '5 5',
        stroke: selected ? '#3B82F6' : '#CBD5E1',
        strokeWidth: selected ? 2 : 1.5,
    }

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={edgeStyle} />
        </>
    )
})
