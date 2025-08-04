import { parseFromStream } from '../ParseFromStream/ParseFromStream.js'
import { ReadableString } from '../ReadableString/ReadableString.js'

export const parseFromJson = async (json, options = {}) => {
  const string = JSON.stringify(json)
  const stream = new ReadableString(string)
  const result = await parseFromStream(stream, options)
  return result
}
