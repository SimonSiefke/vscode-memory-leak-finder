const RE_DASH = /-([a-z])/g

export const camelCase = (value) => {
  const camelCased = value.replace(RE_DASH, (g) => {
    return g[1].toUpperCase()
  })
  return camelCased
}
