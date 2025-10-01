import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as Assert from '../Assert/Assert.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import { getSummary } from '../GetSummary/GetSummary.ts'

export const compare = async (connectionId: number, context: any, resultPath: string): Promise<any> => {
  Assert.number(connectionId)
  Assert.string(resultPath)
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const { before, after } = measure
  if (!before) {
    throw new Error(`before missing`)
  }
  if (!after) {
    throw new Error(`after missing`)
  }
  const result = await measure.compare(before, after, context)

  await JsonFile.writeJson(resultPath, result)
  return {
    isLeak: result.isLeak || false,
    summary: getSummary(result),
  }
}
