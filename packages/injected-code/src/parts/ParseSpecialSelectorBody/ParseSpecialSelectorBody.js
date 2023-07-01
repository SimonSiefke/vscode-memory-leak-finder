import * as Assert from '../Assert/Assert.js'

export const parseInt = (body, specialSelectorPrefix) => {
  Assert.string(body)
  Assert.string(specialSelectorPrefix)
  const content = body.slice(specialSelectorPrefix.length, -1)
  const value = Number.parseInt(content)
  return value
}

export const parseString = (body, specialSelectorPrefix) => {
  Assert.string(body)
  Assert.string(specialSelectorPrefix)
  const content = body.slice(specialSelectorPrefix.length + 1, -2)
  return content
}
