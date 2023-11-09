const prefix = 'data:application/json;base64,'

export const loadSourceMap = (dataUrl) => {
  if (!dataUrl.startsWith(prefix)) {
    throw new Error(`only json data urls are supported`)
  }
  const rest = dataUrl.slice(prefix.length)
  const restString = Buffer.from(rest, 'base64').toString()
  const data = JSON.parse(restString)
  return data
}
