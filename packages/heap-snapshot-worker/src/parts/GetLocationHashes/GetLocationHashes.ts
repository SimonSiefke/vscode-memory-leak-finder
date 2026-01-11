import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'

export const getLocationHashes = (locations: Uint32Array): readonly string[] => {
  const hashes: string[] = []
  for (let i = 0; i < locations.length; i += 3) {
    const scriptId = locations[i]
    const line = locations[i + 1]
    const column = locations[i + 2]
    const hash = getLocationKey(scriptId, line, column)
    hashes.push(hash)
  }
  return hashes
}
