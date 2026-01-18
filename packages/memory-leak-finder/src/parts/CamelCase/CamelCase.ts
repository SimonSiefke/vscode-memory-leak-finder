const RE_DASH = /(-|_)([a-z0-9])/g

export const camelCase = (value: string): string => {
  const camelCased = value.replaceAll(RE_DASH, (match: string, dash: string, char: string) => {
    if (char >= '0' && char <= '9') {
      return char
    }
    return char.toUpperCase()
  })
  return camelCased
}
