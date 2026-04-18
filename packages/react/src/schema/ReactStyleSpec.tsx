import { addStyleAttributes, createInternalStyleSpec, getStyleParseRules, StyleConfig, stylePropsToAttributes } from '@lcw-doc/core'
import { Mark } from '@tiptap/react'
import { FC } from 'react'

import { renderToDOMSpec } from './@util/ReactRenderUtil'

export type ReactCustomStyleImplementation<T extends StyleConfig> = {
    render: T['propSchema'] extends 'boolean'
        ? FC<{ contentRef: (el: HTMLElement | null) => void }>
        : FC<{ contentRef: (el: HTMLElement | null) => void; value: string }>
}

export function createReactStyleSpec<T extends StyleConfig>(styleConfig: T, styleImplementation: ReactCustomStyleImplementation<T>) {
    const mark = Mark.create({
        name: styleConfig.type,

        addAttributes() {
            return stylePropsToAttributes(styleConfig.propSchema)
        },

        parseHTML() {
            return getStyleParseRules(styleConfig)
        },

        renderHTML({ mark }) {
            const props: any = {}

            if (styleConfig.propSchema === 'string') {
                props.value = mark.attrs.stringValue
            }

            const Content = styleImplementation.render
            const renderResult = renderToDOMSpec(refCB => <Content {...props} contentRef={refCB} />, undefined)

            return addStyleAttributes(renderResult, styleConfig.type, mark.attrs.stringValue, styleConfig.propSchema)
        },
    })

    return createInternalStyleSpec(styleConfig, {
        mark,
    })
}
