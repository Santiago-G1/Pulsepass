import { describe, expect, it } from 'vitest'
import { formatoCOP } from './formato'

describe('formato de moneda', () => {
  it('presenta precios en pesos colombianos', () => {
    expect(formatoCOP(250000)).toMatch(/250\.000/)
    expect(formatoCOP(250000)).toMatch(/COP|\$/)
  })
})
