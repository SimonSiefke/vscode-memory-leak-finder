import * as Assert from '../Assert/Assert.js'

export const toHaveCount = (elements, { count }) => {
  Assert.array(elements)
  Assert.number(count)
  return elements.length === count
}

export const toBeHidden = (elements) => {
  return elements.length === 0
}
