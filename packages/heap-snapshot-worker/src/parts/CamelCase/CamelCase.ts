const RE_DASH = /(-|_)([a-z])/g

<<<<<<< HEAD
const replacer = (substring: string, ...args: any[]) => {
  return args[0].toUpperCase()
=======
const replacer = (substring: string, dash: string, letter: string): string => {
  return letter.toUpperCase()
>>>>>>> origin/main
}

export const camelCase = (value: string) => {
  const camelCased = value.replaceAll(RE_DASH, replacer)
  return camelCased
}
