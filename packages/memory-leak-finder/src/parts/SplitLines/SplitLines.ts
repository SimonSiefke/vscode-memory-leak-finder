export const splitLines = (string) => {
  if (string === '') {
    return []
  }
  return string.split('\n')
}
