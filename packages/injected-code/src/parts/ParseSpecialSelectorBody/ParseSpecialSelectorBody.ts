import * as Assert from '../Assert/Assert.ts'

export const parseInt = (body: string, specialSelectorPrefix: string): number => {
  Assert.string(body)
  Assert.string(specialSelectorPrefix)
  const content = body.slice(specialSelectorPrefix.length, -1)
  const value = Number.parseInt(content)
  return value
}

export const parseString = (body: string, specialSelectorPrefix: string): string => {
  Assert.string(body)
  Assert.string(specialSelectorPrefix)
  const content = body.slice(specialSelectorPrefix.length + 1, -2)
  return content
}
