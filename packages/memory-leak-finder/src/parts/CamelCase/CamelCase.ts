import type { Dynamic } from '../Types/Types.ts'
const RE_DASH = /(-|_)([a-z0-9])/g
export const camelCase = (value: Dynamic) => {
  const camelCased = value.replaceAll(RE_DASH, (match: Dynamic, dash: Dynamic, char: Dynamic) => {
    if (char >= '0' && char <= '9') {
      return char
    }
    return char.toUpperCase()
  })
  return camelCased
}
