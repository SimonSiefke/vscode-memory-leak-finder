import * as GetOriginalClassName from '../src/parts/GetOriginalClassName/GetOriginalClassName.js'

test('getOriginalClassName', () => {
  const sourceContent = `class Test {
  constructor(value){
    this.value = value
  }
}`
  const originalLine = 1
  const originalColumn = 14
  expect(GetOriginalClassName.getOriginalClassName(sourceContent, originalLine, originalColumn)).toBe('Test')
})
