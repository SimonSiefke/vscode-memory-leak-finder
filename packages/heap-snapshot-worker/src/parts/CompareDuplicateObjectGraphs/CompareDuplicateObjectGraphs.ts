import { getDuplicateObjectGraphs } from '../GetDuplicateObjectGraphs/GetDuplicateObjectGraphs.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const analyze = async (path: string) => getDuplicateObjectGraphs(await prepareHeapSnapshot(path, { parseStrings: true }))

export const compareDuplicateObjectGraphs = async (beforePath: string, afterPath: string) => {
  // Release the first graph before parsing the second large snapshot.
  const beforeDetails = await analyze(beforePath)
  const afterDetails = await analyze(afterPath)
  if (!beforeDetails.complete || !afterDetails.complete) {
    throw new Error(
      `duplicate-object-graphs: graph verification budget exceeded (before: ${beforeDetails.statistics.unverifiedObjects}, after: ${afterDetails.statistics.unverifiedObjects} unverified objects). Partial totals cannot establish a leak.`,
    )
  }
  return {
    before: beforeDetails.duplicateBytes,
    after: afterDetails.duplicateBytes,
    delta: afterDetails.duplicateBytes - beforeDetails.duplicateBytes,
    beforeDetails,
    afterDetails,
  }
}
