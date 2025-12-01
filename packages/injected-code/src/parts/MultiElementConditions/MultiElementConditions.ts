import * as Assert from '../Assert/Assert.ts'

export const toHaveCount = (elements, { count }) => {
  Assert.array(elements)
  Assert.number(count)
  return elements.length === count
}

export const toBeHidden = (elements) => {
  return elements.length === 0
}
