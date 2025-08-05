import { parseFromStream } from '../ParseFromStream/ParseFromStream.js'
import { createReadableString } from '../ReadableString/ReadableString.js'

export const parseFromJson = async (json, options) => {
  const string = JSON.stringify(json)
  const stream = createReadableString(string)
  const result = await parseFromStream(stream, options)
  return result
}
