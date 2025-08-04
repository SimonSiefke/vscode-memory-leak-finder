import * as PrepareHeapSnapshot from '../ParseFromFile/ParseFromFile.js'
import { parseFromJson } from '../ParseFromJson/ParseFromJson.js'

export const commandMap = {
  'HeapSnapshot.parse': PrepareHeapSnapshot.parseFromFile,
  'HeapSnapshot.parseFromJson': parseFromJson,
}
