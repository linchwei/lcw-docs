import { FileBlockConfig } from '@lcw-doc/core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { RiFile2Line } from 'react-icons/ri'

import { useUploadLoading } from '../../hooks/useUploadLoading'
import { useDictionary } from '../../i18n/dictionary'
import { ReactCustomBlockRenderProps } from '../../schema/ReactBlockSpec'

export const FileBlockWrapper = (
    props: Omit<ReactCustomBlockRenderProps<FileBlockConfig, any, any>, 'contentRef'> & {
        buttonText?: string
        buttonIcon?: ReactNode
        children: ReactNode
    }
) => {
    const showLoader = useUploadLoading(props.block.id)

    if (showLoader) {
        return <div className={'bn-file-loading-preview'}>Loading...</div>
    }

    return (
        <div className={'bn-file-block-content-wrapper'}>
            {props.block.props.url === '' ? (
                <AddFileButton {...props} />
            ) : props.block.props.showPreview === false ? (
                <FileAndCaptionWrapper block={props.block} editor={props.editor as any}>
                    <DefaultFilePreview block={props.block} editor={props.editor as any} />
                </FileAndCaptionWrapper>
            ) : (
                <FileAndCaptionWrapper block={props.block} editor={props.editor as any}>
                    {props.children}
                </FileAndCaptionWrapper>
            )}
        </div>
    )
}

export const DefaultFilePreview = (props: Omit<ReactCustomBlockRenderProps<FileBlockConfig, any, any>, 'contentRef'>) => (
    <div className={'bn-file-default-preview'} contentEditable={false} draggable={false}>
        <div className={'bn-file-default-preview-icon'}>
            <RiFile2Line size={24} />
        </div>
        <p className={'bn-file-default-preview-name'}>{props.block.props.name}</p>
    </div>
)

export const FileAndCaptionWrapper = (
    props: Omit<ReactCustomBlockRenderProps<FileBlockConfig, any, any>, 'contentRef'> & {
        children: ReactNode
    }
) => {
    return (
        <div className={'bn-file-and-caption-wrapper'}>
            {props.children}
            {props.block.props.caption && <p className={'bn-file-caption'}>{props.block.props.caption}</p>}
        </div>
    )
}

export const AddFileButton = (
    props: Omit<ReactCustomBlockRenderProps<FileBlockConfig, any, any>, 'contentRef'> & {
        buttonText?: string
        buttonIcon?: ReactNode
    }
) => {
    const dict = useDictionary()

    const addFileButtonMouseDownHandler = useCallback((event: React.MouseEvent) => {
        event.preventDefault()
    }, [])
    const addFileButtonClickHandler = useCallback(() => {
        props.editor.dispatch(
            props.editor._tiptapEditor.state.tr.setMeta(props.editor.filePanel!.plugin, {
                block: props.block,
            })
        )
    }, [props.block, props.editor])

    return (
        <div className={'bn-add-file-button'} onMouseDown={addFileButtonMouseDownHandler} onClick={addFileButtonClickHandler}>
            <div className={'bn-add-file-button-icon'}>{props.buttonIcon || <RiFile2Line size={24} />}</div>
            <div className={'bn-add-file-button-text'}>{props.buttonText || dict.file_blocks.file.add_button_text}</div>
        </div>
    )
}

export const LinkWithCaption = (props: { caption: string; children: ReactNode }) => (
    <div>
        {props.children}
        <p>{props.caption}</p>
    </div>
)

export const FigureWithCaption = (props: { caption: string; children: ReactNode }) => (
    <figure>
        {props.children}
        <figcaption>{props.caption}</figcaption>
    </figure>
)

export const ResizeHandlesWrapper = (
    props: Required<Omit<ReactCustomBlockRenderProps<FileBlockConfig, any, any>, 'contentRef'>> & {
        width: number
        setWidth: (width: number) => void
        children: ReactNode
    }
) => {
    const [childHovered, setChildHovered] = useState<boolean>(false)
    const [resizeParams, setResizeParams] = useState<
        | {
              initialWidth: number
              initialClientX: number
              handleUsed: 'left' | 'right'
          }
        | undefined
    >(undefined)

    useEffect(() => {
        const windowMouseMoveHandler = (event: MouseEvent) => {
            let newWidth: number

            if (props.block.props.textAlignment === 'center') {
                if (resizeParams!.handleUsed === 'left') {
                    newWidth = resizeParams!.initialWidth + (resizeParams!.initialClientX - event.clientX) * 2
                } else {
                    newWidth = resizeParams!.initialWidth + (event.clientX - resizeParams!.initialClientX) * 2
                }
            } else {
                if (resizeParams!.handleUsed === 'left') {
                    newWidth = resizeParams!.initialWidth + resizeParams!.initialClientX - event.clientX
                } else {
                    newWidth = resizeParams!.initialWidth + event.clientX - resizeParams!.initialClientX
                }
            }

            const minWidth = 64

            if (newWidth < minWidth) {
                props.setWidth(minWidth)
            } else if (newWidth > props.editor.domElement.firstElementChild!.clientWidth) {
                props.setWidth(props.editor.domElement.firstElementChild!.clientWidth)
            } else {
                props.setWidth(newWidth)
            }
        }

        const windowMouseUpHandler = () => {
            setResizeParams(undefined)
            ;(props.editor as any).updateBlock(props.block, {
                props: {
                    previewWidth: props.width,
                },
            })
        }

        if (resizeParams) {
            window.addEventListener('mousemove', windowMouseMoveHandler)
            window.addEventListener('mouseup', windowMouseUpHandler)
        }

        return () => {
            window.removeEventListener('mousemove', windowMouseMoveHandler)
            window.removeEventListener('mouseup', windowMouseUpHandler)
        }
    }, [props, resizeParams])

    const childWrapperMouseEnterHandler = useCallback(() => {
        if (props.editor.isEditable) {
            setChildHovered(true)
        }
    }, [props.editor.isEditable])

    const childWrapperMouseLeaveHandler = useCallback(() => {
        setChildHovered(false)
    }, [])

    const leftResizeHandleMouseDownHandler = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault()

            setResizeParams({
                handleUsed: 'left',
                initialWidth: props.width,
                initialClientX: event.clientX,
            })
        },
        [props.width]
    )
    const rightResizeHandleMouseDownHandler = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault()

            setResizeParams({
                handleUsed: 'right',
                initialWidth: props.width,
                initialClientX: event.clientX,
            })
        },
        [props.width]
    )

    return (
        <div
            className={'bn-visual-media-wrapper'}
            onMouseEnter={childWrapperMouseEnterHandler}
            onMouseLeave={childWrapperMouseLeaveHandler}
        >
            {props.children}
            {(childHovered || resizeParams) && (
                <>
                    <div
                        className={'bn-visual-media-resize-handle'}
                        style={{ left: '4px' }}
                        onMouseDown={leftResizeHandleMouseDownHandler}
                    />
                    <div
                        className={'bn-visual-media-resize-handle'}
                        style={{ right: '4px' }}
                        onMouseDown={rightResizeHandleMouseDownHandler}
                    />
                </>
            )}
        </div>
    )
}
