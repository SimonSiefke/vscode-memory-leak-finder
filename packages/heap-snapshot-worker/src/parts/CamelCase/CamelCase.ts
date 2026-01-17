const RE_DASH = /(-|_)([a-z])/g

const replacer = (substring: string, ...args: any[]) => {
  return args[0].toUpperCase()
}

export const camelCase = (value: string) => {
  const camelCased = value.replaceAll(RE_DASH, replacer)
  return camelCased
}
