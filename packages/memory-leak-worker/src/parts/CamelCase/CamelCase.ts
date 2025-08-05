const RE_DASH = /-([a-z])/g

export const camelCase = (value: string): string => {
  const camelCased = value.replace(RE_DASH, (g: string) => {
    return g[1].toUpperCase()
  })
  return camelCased
}
