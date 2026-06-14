import type { PartialBlock } from '../blocks/defaultBlocks'

export function extractTextFromBlocks(blocks: PartialBlock[], maxLength = 6000): string {
    let text = ''
    for (const block of blocks) {
        if (block.content) {
            if (typeof block.content === 'string') {
                text += block.content + '\n'
            } else if (Array.isArray(block.content)) {
                for (const inline of block.content) {
                    if (typeof inline === 'string') {
                        text += inline
                    } else if (inline.type === 'text' && inline.text) {
                        text += inline.text
                    }
                }
                text += '\n'
            }
        }
        if (block.children) {
            text += extractTextFromBlocks(block.children, maxLength)
        }
    }
    return text.slice(0, maxLength)
}
