export const getLocationKey = (scriptId: number, line: number, column: number) => {
  const key = `${scriptId}:${line}:${column}`
  return key
}
