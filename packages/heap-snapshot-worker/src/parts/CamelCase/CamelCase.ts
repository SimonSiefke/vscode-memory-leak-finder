const RE_DASH = /(-|_)([a-z])/g

const replacer = (substring: string, dash: string, letter: string): string => {
  return letter.toUpperCase()
}

export const camelCase = (value: string) => {
  const camelCased = value.replaceAll(RE_DASH, replacer)
  return camelCased
}
