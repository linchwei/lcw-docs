import { FileText, Plus } from 'lucide-react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
    onCreate: () => void
}

export function EmptyState({ onCreate }: EmptyStateProps) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <FileText className={styles.icon} size={40} />
            </div>
            <h2 className={styles.title}>开始创建你的第一篇文档</h2>
            <p className={styles.description}>点击下方按钮，开启你的协作之旅</p>
            <button className={styles.button} onClick={onCreate}>
                <Plus size={16} />
                新建文档
            </button>
        </div>
    )
}
