import * as Assert from '../Assert/Assert.ts'
import { getSummary } from '../GetSummary/GetSummary.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const compare = async (connectionId: number, context: any, resultPath: string): Promise<any> => {
  Assert.number(connectionId)
  Assert.string(resultPath)
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error(`no measure found`)
  }
  const { measure } = state
  const { after, before } = state
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
