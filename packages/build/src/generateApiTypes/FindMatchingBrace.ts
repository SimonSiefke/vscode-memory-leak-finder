export const findMatchingBrace = (str: string, startIndex: number): number => {
  let depth = 1
  let i = startIndex + 1
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++
    if (str[i] === '}') depth--
    i++
  }
  return depth === 0 ? i - 1 : -1
}
