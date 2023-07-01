export const parseInt = (body, specialSelectorPrefix) => {
  const content = body.slice(specialSelectorPrefix.length, -1)
  const value = parseInt(content)
  return value
}

export const parseString = (body, specialSelectorPrefix) => {
  const content = body.slice(specialSelectorPrefix.length + 1, -2)
  return content
}
