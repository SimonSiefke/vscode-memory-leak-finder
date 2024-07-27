import { once } from 'node:events'

export const waitForData = async (stream, key, errorChecker) => {
  for (let i = 0; i < 10; i++) {
    const [data] = await once(stream, 'data')
    if (data.includes(key)) {
      return data
    }
    await errorChecker(data, stream)
  }
  return ''
}
