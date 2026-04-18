/**
 * 属性类型定义模块
 *
 * 此文件定义了编辑器中属性(prop)相关的基础类型，用于描述属性的模式和规范。
 * 属性用于块、内联内容等元素的配置参数。
 */

/**
 * 属性规范
 * 定义单个属性的类型和可选的值列表
 * @template PType - 属性类型，支持布尔、数字或字符串
 */
export type PropSpec<PType extends boolean | number | string> = {
    /** 可选的允许值列表 */
    values?: readonly PType[]
    /** 属性默认值 */
    default: PType
}

/**
 * 属性模式
 * 记录所有属性的规范
 */
export type PropSchema = Record<string, PropSpec<boolean | number | string>>

/**
 * 属性值类型
 * 根据属性模式生成具体的属性值类型
 */
export type Props<PSchema extends PropSchema> = {
    [PName in keyof PSchema]: PSchema[PName]['default'] extends boolean
        ? PSchema[PName]['values'] extends readonly boolean[]
            ? PSchema[PName]['values'][number]
            : boolean
        : PSchema[PName]['default'] extends number
          ? PSchema[PName]['values'] extends readonly number[]
              ? PSchema[PName]['values'][number]
              : number
          : PSchema[PName]['default'] extends string
            ? PSchema[PName]['values'] extends readonly string[]
                ? PSchema[PName]['values'][number]
                : string
            : never
}
