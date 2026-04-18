import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'

import styles from './MarkdownUploadDialog.module.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024

type UploadStep = 'select' | 'reading' | 'preview' | 'generating' | 'error'

interface MarkdownUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

function extractTitle(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m)
    return match ? match[1].trim() : ''
}

export function MarkdownUploadDialog({ open, onOpenChange }: MarkdownUploadDialogProps) {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState<UploadStep>('select')
    const [progress, setProgress] = useState(0)
    const [fileName, setFileName] = useState('')
    const [markdownContent, setMarkdownContent] = useState('')
    const [extractedTitle, setExtractedTitle] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isDragging, setIsDragging] = useState(false)

    const resetState = useCallback(() => {
        setStep('select')
        setProgress(0)
        setFileName('')
        setMarkdownContent('')
        setExtractedTitle('')
        setErrorMessage('')
        setIsDragging(false)
    }, [])

    const processFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.md')) {
            setErrorMessage('仅支持 .md 格式文件')
            setStep('error')
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage('文件大小超过限制（最大 5 MB）')
            setStep('error')
            return
        }

        setFileName(file.name)
        setStep('reading')

        const reader = new FileReader()

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100))
            }
        }

        reader.onload = async () => {
            const markdown = reader.result as string
            setMarkdownContent(markdown)

            const title = extractTitle(markdown)
            setExtractedTitle(title)

            setStep('preview')
        }

        reader.onerror = () => {
            setErrorMessage('文件读取失败，请重试')
            setStep('error')
        }

        reader.readAsText(file)
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [processFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }, [processFile])

    const handleGenerate = useCallback(async () => {
        setStep('generating')

        try {
            sessionStorage.setItem('md-pending-markdown', markdownContent)

            const res = await srv.createPage({
                emoji: '📝',
                title: extractedTitle || '未命名文档',
            })

            onOpenChange(false)
            navigate(`/doc/${res.data.pageId}`)
        } catch (err: any) {
            setErrorMessage(`文档创建失败：${err.message || '未知错误'}`)
            setStep('error')
        }
    }, [markdownContent, extractedTitle, navigate, onOpenChange])

    const previewLines = markdownContent.split('\n').slice(0, 20)
    const totalLines = markdownContent.split('\n').length

    return (
        <Dialog.Root open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v) }}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={styles.content}>
                    <Dialog.Title className={styles.dialogTitle}>上传 Markdown 文档</Dialog.Title>
                    <Dialog.Description className={styles.dialogDesc}>上传 .md 文件，解析后生成协同文档</Dialog.Description>
                    <button className={styles.closeBtn} onClick={() => { resetState(); onOpenChange(false) }}>
                        <X size={18} />
                    </button>

                    {step === 'select' && (
                        <div
                            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={40} className={styles.dropIcon} />
                            <p className={styles.dropText}>拖拽 .md 文件到此处</p>
                            <p className={styles.dropHint}>或点击选择文件（最大 5 MB）</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".md"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />
                        </div>
                    )}

                    {step === 'reading' && (
                        <div className={styles.progressSection}>
                            <Loader2 size={24} className={styles.spinner} />
                            <p className={styles.progressText}>正在读取文件：{fileName}</p>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className={styles.previewSection}>
                            <div className={styles.previewHeader}>
                                <FileUp size={16} />
                                <span className={styles.fileName}>{fileName}</span>
                                <span className={styles.previewStats}>
                                    {totalLines} 行
                                </span>
                            </div>

                            {extractedTitle && (
                                <div className={styles.titlePreview}>
                                    文档标题：<strong>{extractedTitle}</strong>
                                </div>
                            )}

                            <div className={styles.previewList}>
                                <pre className={styles.markdownPreview}>{previewLines.join('\n')}</pre>
                                {totalLines > 20 && (
                                    <p className={styles.moreLines}>... 还有 {totalLines - 20} 行</p>
                                )}
                            </div>

                            <div className={styles.previewActions}>
                                <button className={styles.cancelBtn} onClick={resetState}>重新选择</button>
                                <button
                                    className={styles.generateBtn}
                                    onClick={handleGenerate}
                                >
                                    确认生成
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className={styles.progressSection}>
                            <Loader2 size={24} className={styles.spinner} />
                            <p className={styles.progressText}>正在创建文档并写入内容...</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className={styles.resultSection}>
                            <AlertCircle size={40} className={styles.errorIcon} />
                            <p className={styles.resultText}>{errorMessage}</p>
                            <button className={styles.cancelBtn} onClick={resetState}>重新选择</button>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
