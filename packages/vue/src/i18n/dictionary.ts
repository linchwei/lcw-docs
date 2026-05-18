import { type Dictionary, locales } from '@lcw-doc/core'
import { inject, type InjectionKey, provide } from 'vue'

type PartialDictionary = Partial<Dictionary>

const defaultDictionary: Dictionary = locales.en

const DICT_KEY: InjectionKey<Dictionary> = Symbol('lcwDocDictionary')

export function provideDictionary(dict?: PartialDictionary) {
    provide(DICT_KEY, { ...defaultDictionary, ...dict } as Dictionary)
}

export function useDictionary(): Dictionary {
    return inject(DICT_KEY, defaultDictionary as Dictionary)
}
