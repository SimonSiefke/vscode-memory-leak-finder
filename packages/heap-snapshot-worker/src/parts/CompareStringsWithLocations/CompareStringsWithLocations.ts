import { getStringsWithLocations, type StringLocationScriptMap } from '../GetStringsWithLocations/GetStringsWithLocations.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareStringsWithLocations = async (
  beforePath: string,
  afterPath: string,
  beforeScripts: StringLocationScriptMap,
  afterScripts: StringLocationScriptMap,
) => {
  const before = getStringsWithLocations(await prepareHeapSnapshot(beforePath, { parseStrings: true }), beforeScripts)
  const after = getStringsWithLocations(await prepareHeapSnapshot(afterPath, { parseStrings: true }), afterScripts)
  return { before, after }
}
