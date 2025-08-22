const RE_DASH = /(-|_)([a-z])/g

export const camelCase = (value) => {
  const camelCased = value.replaceAll(RE_DASH, (g) => {
    return g[1].toUpperCase()
  })
  return camelCased
}
