const RE_DASH = /(-|_)([a-z])/g

const replacer = (g) => {
  return g[1].toUpperCase()
}

export const camelCase = (value) => {
  const camelCased = value.replace(RE_DASH, replacer)
  return camelCased
}
