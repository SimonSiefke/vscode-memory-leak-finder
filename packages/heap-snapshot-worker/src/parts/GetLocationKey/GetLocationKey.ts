export const getLocationKey = (scriptId: number, line: number, column: number): string => {
  const key = `${scriptId}:${line}:${column}`
  return key
}
