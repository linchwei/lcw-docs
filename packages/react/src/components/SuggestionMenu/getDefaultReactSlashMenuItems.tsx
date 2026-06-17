import { BlockSchema, getDefaultSlashMenuItems, InlineContentSchema, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import {
    RiAlertLine,
    RiCodeBlock,
    RiDoubleQuotesL,
    RiEmotionFill,
    RiFile2Line,
    RiFilmLine,
    RiFunctionLine,
    RiH1,
    RiH2,
    RiH3,
    RiImage2Fill,
    RiListCheck3,
    RiListOrdered,
    RiListUnordered,
    RiSeparator,
    RiTable2,
    RiText,
    RiVolumeUpFill,
} from 'react-icons/ri'

import { DefaultReactSuggestionItem } from './types'

const HeadingIcon = ({ level }: { level: number }) => <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>H{level}</span>

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
    heading: RiH1,
    heading_2: RiH2,
    heading_3: RiH3,
    heading_4: (() => {
        const H = () => <HeadingIcon level={4} />
        return H as any
    })(),
    heading_5: (() => {
        const H = () => <HeadingIcon level={5} />
        return H as any
    })(),
    heading_6: (() => {
        const H = () => <HeadingIcon level={6} />
        return H as any
    })(),
    numbered_list: RiListOrdered,
    bullet_list: RiListUnordered,
    check_list: RiListCheck3,
    paragraph: RiText,
    table: RiTable2,
    image: RiImage2Fill,
    video: RiFilmLine,
    audio: RiVolumeUpFill,
    file: RiFile2Line,
    emoji: RiEmotionFill,
    code_block: RiCodeBlock,
    callout: RiAlertLine,
    math_block: RiFunctionLine,
    divider: RiSeparator,
    blockquote: RiDoubleQuotesL,
}

export function getDefaultReactSlashMenuItems<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>
): DefaultReactSuggestionItem[] {
    return getDefaultSlashMenuItems(editor).map(item => {
        const Icon = icons[item.key]
        return {
            ...item,
            icon: <Icon size={18} />,
        }
    })
}
