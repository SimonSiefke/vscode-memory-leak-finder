import * as Assert from '../Assert/Assert.ts'

export const toHaveCount = (elements: readonly Element[], { count }: { count: number }): boolean => {
  Assert.array(elements)
  Assert.number(count)
  return elements.length === count
}

export const toBeHidden = (elements: readonly Element[]): boolean => {
  return elements.length === 0
}
