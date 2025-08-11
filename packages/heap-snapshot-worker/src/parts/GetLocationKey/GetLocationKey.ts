export const getLocationKey = (scriptId, line, column) => {
  const key = `${scriptId}:${line}:${column}`
  return key
}
