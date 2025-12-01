import { parseFromStream } from '../ParseFromStream/ParseFromStream.ts'
import { createReadableString } from '../ReadableString/ReadableString.ts'

/**
 * Parses a heap snapshot from JSON data and returns the parsed data with transferable arrays
 * @param {any} json - The JSON data to parse
 * @param {Object} [options={ parseStrings: false }] - Options for parsing
 * @param {boolean} [options.parseStrings=false] - Whether to parse and return strings
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array, strings: string[]}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const parseFromJson = async (json, options = { parseStrings: false }) => {
  const string = JSON.stringify(json)
  const stream = createReadableString(string)
  const result = await parseFromStream(stream, options)
  return result
}
