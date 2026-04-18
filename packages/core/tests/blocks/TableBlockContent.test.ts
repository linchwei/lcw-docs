import { describe, expect, test } from 'vitest'

import { TableBlockContent, Table, tablePropSchema } from '../../src/blocks/TableBlockContent/TableBlockContent'

describe('TableBlockContent', () => {
  describe('TableBlockContent 创建', () => {
    test('TableBlockContent 应该被定义', () => {
      expect(TableBlockContent).toBeDefined()
    })

    test('TableBlockContent 应该有正确的名称', () => {
      expect(TableBlockContent.name).toBe('table')
    })
  })

  describe('TableParagraph 创建', () => {
    test('Table 应该包含 tableParagraph 扩展', () => {
      const requiredExtensions = Table.implementation.requiredExtensions
      expect(requiredExtensions).toBeDefined()
      expect(Array.isArray(requiredExtensions)).toBe(true)

      const hasTableParagraph = requiredExtensions?.some(
        ext => ext.name === 'tableParagraph'
      )
      expect(hasTableParagraph).toBe(true)
    })

    test('Table 应该包含 TableExtension', () => {
      const requiredExtensions = Table.implementation.requiredExtensions
      expect(requiredExtensions).toBeDefined()

      const hasTableExtension = requiredExtensions?.some(
        ext => ext.name === 'LcwDocTableExtension'
      )
      expect(hasTableExtension).toBe(true)
    })

    test('Table 应该包含 TableRow', () => {
      const requiredExtensions = Table.implementation.requiredExtensions
      expect(requiredExtensions).toBeDefined()

      const hasTableRow = requiredExtensions?.some(
        ext => ext.name === 'tableRow'
      )
      expect(hasTableRow).toBe(true)
    })
  })

  describe('tablePropSchema 属性定义', () => {
    test('tablePropSchema 应该被定义', () => {
      expect(tablePropSchema).toBeDefined()
    })

    test('tablePropSchema 应该有 backgroundColor 属性', () => {
      expect(tablePropSchema.backgroundColor).toBeDefined()
      expect(tablePropSchema.backgroundColor.default).toBe('default')
    })

    test('tablePropSchema 应该有 textColor 属性', () => {
      expect(tablePropSchema.textColor).toBeDefined()
      expect(tablePropSchema.textColor.default).toBe('default')
    })

    test('Table.config.propSchema 应该包含 backgroundColor 和 textColor', () => {
      expect(Table.config.propSchema.backgroundColor).toBeDefined()
      expect(Table.config.propSchema.textColor).toBeDefined()
    })
  })

  describe('addNodeView 配置', () => {
    test('Table.implementation.node 应该被定义', () => {
      const node = Table.implementation.node
      expect(node).toBeDefined()
    })

    test('Table.implementation.node 应该有正确的名称', () => {
      expect(Table.implementation.node.name).toBe('table')
    })

    test('Table.implementation.node 应该是一个 TipTap Node 实例', () => {
      const node = Table.implementation.node
      expect(node).toBeInstanceOf(Object)
      expect(node.name).toBe('table')
    })
  })
})