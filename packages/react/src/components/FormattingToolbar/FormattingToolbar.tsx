import { ReactElement, ReactNode } from 'react'

import { useComponentsContext } from '../../editor/ComponentsContext'
import { BasicTextStyleButton } from './DefaultButtons/BasicTextStyleButton'
import { ColorStyleButton } from './DefaultButtons/ColorStyleButton'
import { CreateLinkButton } from './DefaultButtons/CreateLinkButton'
import { FileCaptionButton } from './DefaultButtons/FileCaptionButton'
import { FileDeleteButton } from './DefaultButtons/FileDeleteButton'
import { FileDownloadButton } from './DefaultButtons/FileDownloadButton'
import { FilePreviewButton } from './DefaultButtons/FilePreviewButton'
import { FileRenameButton } from './DefaultButtons/FileRenameButton'
import { FileReplaceButton } from './DefaultButtons/FileReplaceButton'
import { NestBlockButton, UnnestBlockButton } from './DefaultButtons/NestBlockButtons'
import { TextAlignButton } from './DefaultButtons/TextAlignButton'
import { RedoButton, UndoButton } from './DefaultButtons/UndoRedoButtons'
import { BlockTypeSelect, BlockTypeSelectItem } from './DefaultSelects/BlockTypeSelect'
import { FormattingToolbarProps } from './FormattingToolbarProps'

export const getFormattingToolbarItems = (blockTypeSelectItems?: BlockTypeSelectItem[]): ReactElement[] => [
    <BlockTypeSelect key={'blockTypeSelect'} items={blockTypeSelectItems} />,
    <FileCaptionButton key={'fileCaptionButton'} />,
    <FileReplaceButton key={'replaceFileButton'} />,
    <FileRenameButton key={'fileRenameButton'} />,
    <FileDeleteButton key={'fileDeleteButton'} />,
    <FileDownloadButton key={'fileDownloadButton'} />,
    <FilePreviewButton key={'filePreviewButton'} />,
    <BasicTextStyleButton basicTextStyle={'bold'} key={'boldStyleButton'} />,
    <BasicTextStyleButton basicTextStyle={'italic'} key={'italicStyleButton'} />,
    <BasicTextStyleButton basicTextStyle={'underline'} key={'underlineStyleButton'} />,
    <BasicTextStyleButton basicTextStyle={'strike'} key={'strikeStyleButton'} />,
    <TextAlignButton textAlignment={'left'} key={'textAlignLeftButton'} />,
    <TextAlignButton textAlignment={'center'} key={'textAlignCenterButton'} />,
    <TextAlignButton textAlignment={'right'} key={'textAlignRightButton'} />,
    <ColorStyleButton key={'colorStyleButton'} />,
    <NestBlockButton key={'nestBlockButton'} />,
    <UnnestBlockButton key={'unnestBlockButton'} />,
    <CreateLinkButton key={'createLinkButton'} />,
    <UndoButton key={'undoButton'} />,
    <RedoButton key={'redoButton'} />,
]

export const FormattingToolbar = (props: FormattingToolbarProps & { children?: ReactNode }) => {
    const Components = useComponentsContext()!

    return (
        <Components.FormattingToolbar.Root className={'bn-toolbar bn-formatting-toolbar'}>
            {props.children || getFormattingToolbarItems(props.blockTypeSelectItems)}
        </Components.FormattingToolbar.Root>
    )
}
