const RE_DASH = /(-|_)([a-z0-9])/g

export const camelCase = (value) => {
  const camelCased = value.replaceAll(RE_DASH, (match, dash, char) => {
    if (char >= '0' && char <= '9') {
      return char
    }
    return char.toUpperCase()
  })
  return camelCased
}
