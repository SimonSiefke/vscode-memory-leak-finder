const RE_DASH = /(-|_)([a-z])/g

const replacer = (g: RegExpMatchArray): string => {
  return g[1].toUpperCase()
}

export const camelCase = (value: string): string => {
  const camelCased = value.replace(RE_DASH, replacer)
  return camelCased
}
