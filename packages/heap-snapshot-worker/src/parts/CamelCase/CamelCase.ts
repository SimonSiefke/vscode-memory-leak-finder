const RE_DASH = /(-|_)([a-z])/g

const replacer = (substring: string, ...args: any[]): string => {
  return args[0].toUpperCase()
}

export const camelCase = (value: string): string => {
  const camelCased = value.replace(RE_DASH, replacer)
  return camelCased
}
