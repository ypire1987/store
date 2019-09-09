import { parseToJsonLD } from './StructuredData'
import product from './__mocks__/product'
import selectedItem from './__mocks__/selectedItem'

test('Return the right JSON', () => {
  const result = parseToJsonLD(product, selectedItem, 'USD')

  expect(result).toBe('a')
})