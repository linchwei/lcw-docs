import { LcwDocEditor } from '@lcw-doc/core'
import {
    Document,
    ExternalHyperlink,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
} from 'docx'
import { saveAs } from 'file-saver'
import html2pdf from 'html2pdf.js'

export type ExportFormat = 'markdown' | 'html' | 'docx' | 'pdf' | 'txt'

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    saveAs(blob, filename)
}

function wrapHTMLDocument(html: string, title: string): string {
    return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #37352f; }
            h1 { font-size: 2em; margin-top: 1.5em; margin-bottom: 0.5em; }
            h2 { font-size: 1.5em; margin-top: 1.3em; margin-bottom: 0.4em; }
            h3 { font-size: 1.25em; margin-top: 1.2em; margin-bottom: 0.3em; }
            h4, h5, h6 { font-size: 1.1em; margin-top: 1em; margin-bottom: 0.3em; }
            p { margin: 0.5em 0; }
            ul, ol { padding-left: 2em; }
            li { margin: 0.25em 0; }
            blockquote { border-left: 3px solid #e0e0e0; padding-left: 1em; margin: 0.5em 0; color: #666; }
            code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; font-family: "SF Mono", "Fira Code", monospace; }
            pre { background: #f5f5f5; padding: 1em; border-radius: 5px; overflow-x: auto; }
            pre code { background: none; padding: 0; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            img { max-width: 100%; height: auto; }
            a { color: #6B45FF; text-decoration: none; }
            a:hover { text-decoration: underline; }
            </style>
            </head>
            <body>
            ${html}
            </body>
            </html>`
}

function wrapHTMLForPDF(html: string, title: string): string {
    return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.8; color: #37352f; font-size: 14px; }
            h1 { font-size: 24px; margin-top: 1.5em; margin-bottom: 0.5em; }
            h2 { font-size: 20px; margin-top: 1.3em; margin-bottom: 0.4em; }
            h3 { font-size: 17px; margin-top: 1.2em; margin-bottom: 0.3em; }
            h4, h5, h6 { font-size: 15px; margin-top: 1em; margin-bottom: 0.3em; }
            p { margin: 0.5em 0; }
            ul, ol { padding-left: 2em; }
            li { margin: 0.25em 0; }
            blockquote { border-left: 3px solid #e0e0e0; padding-left: 1em; margin: 0.5em 0; color: #666; }
            code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; font-family: "SF Mono", "Fira Code", monospace; }
            pre { background: #f5f5f5; padding: 1em; border-radius: 5px; overflow-x: auto; page-break-inside: avoid; }
            pre code { background: none; padding: 0; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; page-break-inside: avoid; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            img { max-width: 100%; height: auto; }
            a { color: #6B45FF; text-decoration: none; }
            </style>
            </head>
            <body>
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
            <h1 style="margin: 0; font-size: 28px;">${title}</h1>
            </div>
            ${html}
            </body>
            </html>`
}

function convertInlineContentToTextRuns(content: any[]): (TextRun | ExternalHyperlink)[] {
    const runs: (TextRun | ExternalHyperlink)[] = []

    for (const item of content) {
        if (typeof item === 'string') {
            runs.push(new TextRun({ text: item }))
            continue
        }

        if (item.type === 'text') {
            const styles = item.styles || {}
            const runOptions: any = {
                text: item.text || '',
                bold: styles.bold || false,
                italics: styles.italic || false,
                underline: styles.underline ? {} : undefined,
                strike: styles.strike || false,
            }

            if (styles.code) {
                runOptions.font = 'Courier New'
                runOptions.shading = { type: ShadingType.SOLID, fill: 'f5f5f5' }
            }

            if (styles.textColor && styles.textColor !== 'default') {
                runOptions.color = styles.textColor.replace('#', '')
            }

            runs.push(new TextRun(runOptions))
        } else if (item.type === 'link') {
            const linkRuns = convertInlineContentToTextRuns(item.content || [])
            runs.push(
                new ExternalHyperlink({
                    link: item.href,
                    children: linkRuns,
                })
            )
        }
    }

    return runs
}

function getAlignment(textAlignment: string | undefined): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
    switch (textAlignment) {
        case 'center':
            return AlignmentType.CENTER
        case 'right':
            return AlignmentType.RIGHT
        case 'justify':
            return AlignmentType.JUSTIFIED
        default:
            return AlignmentType.LEFT
    }
}

function getHeadingLevel(level: number | undefined): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
    switch (level) {
        case 1:
            return HeadingLevel.HEADING_1
        case 2:
            return HeadingLevel.HEADING_2
        case 3:
            return HeadingLevel.HEADING_3
        case 4:
            return HeadingLevel.HEADING_4
        case 5:
            return HeadingLevel.HEADING_5
        case 6:
            return HeadingLevel.HEADING_6
        default:
            return HeadingLevel.HEADING_1
    }
}

function convertBlocksToDocxChildren(blocks: any[], editor: LcwDocEditor<any, any, any>): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    for (const block of blocks) {
        const props = block.props || {}
        const alignment = getAlignment(props.textAlignment)

        if (block.type === 'heading') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            children.push(
                new Paragraph({
                    heading: getHeadingLevel(props.level),
                    alignment,
                    children: runs,
                })
            )
        } else if (block.type === 'paragraph') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            children.push(new Paragraph({ alignment, children: runs }))
        } else if (block.type === 'bulletListItem') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            children.push(
                new Paragraph({
                    alignment,
                    bullet: { level: 0 },
                    children: runs,
                })
            )
        } else if (block.type === 'numberedListItem') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            children.push(
                new Paragraph({
                    alignment,
                    numbering: { reference: 'default-numbering', level: 0 },
                    children: runs,
                })
            )
        } else if (block.type === 'checkListItem') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            const prefix = props.checked ? '☑ ' : '☐ '
            runs.unshift(new TextRun({ text: prefix }))
            children.push(new Paragraph({ alignment, children: runs }))
        } else if (block.type === 'codeBlock') {
            const content = Array.isArray(block.content) ? block.content : []
            const text = content.map((c: any) => (typeof c === 'string' ? c : c.text || '')).join('')
            const lines = text.split('\n')
            for (const line of lines) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: line, font: 'Courier New', size: 20 })],
                        shading: { type: ShadingType.SOLID, fill: 'f5f5f5' },
                    })
                )
            }
        } else if (block.type === 'quote') {
            const content = Array.isArray(block.content) ? block.content : []
            const runs = convertInlineContentToTextRuns(content)
            children.push(
                new Paragraph({
                    alignment,
                    indent: { left: 720 },
                    border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'e0e0e0', space: 10 } },
                    children: runs,
                })
            )
        } else if (block.type === 'table' && block.content?.type === 'tableContent') {
            const tableContent = block.content
            const rows = tableContent.rows || []
            const columnWidths = tableContent.columnWidths || []

            const tableRows = rows.map((row: any) => {
                const cells = row.cells || []
                return new TableRow({
                    children: cells.map((cell: any) => {
                        const cellContent = Array.isArray(cell) ? cell : []
                        const runs = convertInlineContentToTextRuns(cellContent)
                        return new TableCell({
                            children: [new Paragraph({ children: runs.length > 0 ? runs : [new TextRun('')] })],
                            width:
                                columnWidths.length > 0 ? { size: 100 / Math.max(cells.length, 1), type: WidthType.PERCENTAGE } : undefined,
                        })
                    }),
                })
            })

            if (tableRows.length > 0) {
                children.push(new Table({ rows: tableRows }))
            }
        } else if (block.type === 'image' || block.type === 'file') {
            const caption = props.caption || props.name || ''
            if (caption) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `[${block.type === 'image' ? '图片' : '文件'}: ${caption}]`,
                                italics: true,
                                color: '999999',
                            }),
                        ],
                    })
                )
            }
        }

        if (block.children && block.children.length > 0) {
            const childElements = convertBlocksToDocxChildren(block.children, editor)
            children.push(...childElements)
        }
    }

    return children
}

async function exportMarkdown(editor: LcwDocEditor<any, any, any>, fileName: string) {
    const content = await editor.blocksToMarkdownLossy()
    downloadFile(content, `${fileName}.md`, 'text/markdown;charset=utf-8')
}

async function exportHTML(editor: LcwDocEditor<any, any, any>, fileName: string) {
    const content = await editor.blocksToHTMLLossy()
    const fullHTML = wrapHTMLDocument(content, fileName)
    downloadFile(fullHTML, `${fileName}.html`, 'text/html;charset=utf-8')
}

async function exportTxt(editor: LcwDocEditor<any, any, any>, fileName: string) {
    const text = editor._tiptapEditor.state.doc.textContent || ''
    downloadFile(text, `${fileName}.txt`, 'text/plain;charset=utf-8')
}

async function exportDocx(editor: LcwDocEditor<any, any, any>, fileName: string) {
    const blocks = editor.document
    const docxChildren = convertBlocksToDocxChildren(blocks, editor)

    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }],
                },
            ],
        },
        sections: [
            {
                children: docxChildren,
            },
        ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${fileName}.docx`)
}

async function exportPDF(editor: LcwDocEditor<any, any, any>, fileName: string) {
    const htmlContent = await editor.blocksToHTMLLossy()
    const fullHTML = wrapHTMLForPDF(htmlContent, fileName)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '210mm'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    try {
        iframe.srcdoc = fullHTML

        await new Promise<void>((resolve, reject) => {
            iframe.onload = () => resolve()
            iframe.onerror = () => reject(new Error('iframe load failed'))
            setTimeout(() => reject(new Error('iframe load timeout')), 10000)
        })

        await new Promise(resolve => requestAnimationFrame(resolve))

        const iframeBody = iframe.contentDocument?.body
        if (!iframeBody) {
            throw new Error('Cannot access iframe content')
        }

        await html2pdf()
            .set({
                margin: [15, 15, 15, 15],
                filename: `${fileName}.pdf`,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
                // pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            })
            .from(iframeBody)
            .save()
    } finally {
        document.body.removeChild(iframe)
    }
}

export async function exportDocument(editor: LcwDocEditor<any, any, any>, format: ExportFormat, fileName: string): Promise<void> {
    switch (format) {
        case 'markdown':
            await exportMarkdown(editor, fileName)
            break
        case 'html':
            await exportHTML(editor, fileName)
            break
        case 'txt':
            await exportTxt(editor, fileName)
            break
        case 'docx':
            await exportDocx(editor, fileName)
            break
        case 'pdf':
            await exportPDF(editor, fileName)
            break
        default:
            throw new Error(`Unsupported export format: ${format}`)
    }
}

export function isLargeDocument(editor: LcwDocEditor<any, any, any>): boolean {
    const text = editor._tiptapEditor.state.doc.textContent || ''
    return text.length > 50000
}
