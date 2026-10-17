import { readFile } from 'node:fs/promises'
import { getDeadClosureVariables } from '../GetDeadClosureVariables/GetDeadClosureVariables.ts'

const analyze = async (path: string) => getDeadClosureVariables(JSON.parse(await readFile(path, 'utf8')))

export const compareDeadClosureVariables = async (beforePath: string, afterPath: string) => {
  // Analyze sequentially so the two full heap graphs need not coexist in memory.
  const before = await analyze(beforePath)
  const after = await analyze(afterPath)
  return {
    before: before.deadBytes,
    after: after.deadBytes,
    delta: after.deadBytes - before.deadBytes,
    beforeDetails: before,
    afterDetails: after,
  }
}
