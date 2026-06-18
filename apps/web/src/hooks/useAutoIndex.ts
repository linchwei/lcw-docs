/**
 * 自动增量索引 Hook
 *
 * 监听编辑器文档保存事件，自动触发增量索引。
 * 防抖策略：保存后 5 秒触发，避免频繁索引。
 * 仅在文档已索引过的情况下自动触发（未索引的文档需手动触发首次索引）。
 *
 * @module hooks/useAutoIndex
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { indexForKnowledge } from '@/services/ai'

/** Hook 参数 */
interface UseAutoIndexParams {
    /** 当前文档 ID */
    pageId: string
    /** 文档是否已索引 */
    isIndexed: boolean
    /** 从编辑器提取 blocks 的回调函数 */
    getBlocks: () => Promise<any[]>
}

/** Hook 返回值 */
interface UseAutoIndexReturn {
    /** 是否正在索引 */
    isIndexing: boolean
    /** 手动触发索引 */
    triggerIndex: () => Promise<void>
}

export function useAutoIndex({ pageId, isIndexed, getBlocks }: UseAutoIndexParams): UseAutoIndexReturn {
    const [isIndexing, setIsIndexing] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const pageIdRef = useRef(pageId)
    const isIndexedRef = useRef(isIndexed)
    const getBlocksRef = useRef(getBlocks)
    pageIdRef.current = pageId
    isIndexedRef.current = isIndexed
    getBlocksRef.current = getBlocks

    /** 手动触发索引 */
    const triggerIndex = useCallback(async () => {
        if (!pageIdRef.current || isIndexing) return
        setIsIndexing(true)
        try {
            const blocks = await getBlocksRef.current()
            await indexForKnowledge(pageIdRef.current, blocks)
        } catch (error) {
            console.error('自动索引失败:', error)
        } finally {
            setIsIndexing(false)
        }
    }, [isIndexing])

    /** 监听编辑器保存完成事件，防抖触发增量索引 */
    useEffect(() => {
        if (!isIndexed) return

        const handleSave = () => {
            // 清除之前的防抖定时器
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }

            // 5 秒防抖后触发索引
            debounceRef.current = setTimeout(async () => {
                if (isIndexing) return
                setIsIndexing(true)
                try {
                    const blocks = await getBlocksRef.current()
                    await indexForKnowledge(pageIdRef.current, blocks)
                } catch (error) {
                    console.error('自动增量索引失败:', error)
                } finally {
                    setIsIndexing(false)
                }
            }, 5000)
        }

        // 监听编辑器保存完成的自定义事件
        window.addEventListener('doc-saved', handleSave)

        return () => {
            window.removeEventListener('doc-saved', handleSave)
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [isIndexed, isIndexing, pageId])

    return { isIndexing, triggerIndex }
}
