import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditor,
    LcwDocSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { createContext, useContext, useState } from 'react'

type LcwDocContextValue<
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
> = {
    setContentEditableProps?: ReturnType<typeof useState<Record<string, any>>>[1] // copy type of setXXX from useState
    editor?: LcwDocEditor<BSchema, ISchema, SSchema>
    colorSchemePreference?: 'light' | 'dark'
}

export const LcwDocContext = createContext<LcwDocContextValue | undefined>(undefined)

export function useLcwDocContext<
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(_schema?: LcwDocSchema<BSchema, ISchema, SSchema>): LcwDocContextValue<BSchema, ISchema, SSchema> | undefined {
    const context = useContext(LcwDocContext) as any

    return context
}
