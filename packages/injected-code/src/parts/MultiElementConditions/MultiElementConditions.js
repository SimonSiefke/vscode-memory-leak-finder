export const toHaveCount = (elements, { count }) => {
  return elements.length === count
}

export const toBeHidden = (elements) => {
  return elements.length === 0
}
