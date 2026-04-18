import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { MessageSquare } from 'lucide-react'

interface CommentButtonProps {
    onClick?: () => void
    commentCount?: number
}

export function CommentButton({ onClick, commentCount }: CommentButtonProps) {
    return (
        <Button variant="ghost" size="sm" onClick={onClick}>
            <MessageSquare size={16} className="mr-1" />
            {commentCount !== undefined && commentCount > 0 && <span>{commentCount}</span>}
        </Button>
    )
}
