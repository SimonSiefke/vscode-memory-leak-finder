import * as PrepareHeapSnapshot from '../ParseFromFile/ParseFromFile.ts'
import { parseFromJson } from '../ParseFromJson/ParseFromJson.ts'

export const commandMap = {
  'HeapSnapshot.parse': PrepareHeapSnapshot.parseFromFile,
  'HeapSnapshot.parseFromJson': parseFromJson,
}
