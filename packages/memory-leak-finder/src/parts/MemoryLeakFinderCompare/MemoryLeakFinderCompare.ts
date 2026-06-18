import * as Assert from '../Assert/Assert.ts'
import { getSummary } from '../GetSummary/GetSummary.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import type { MeasureContext, UnknownRecord } from '../Types/Types.ts'

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null
}

export const compare = async (
  connectionId: number,
  context: MeasureContext,
  resultPath: string,
): Promise<{ readonly isLeak: boolean; readonly summary: string }> => {
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
    isLeak: isRecord(result) && result.isLeak === true,
    summary: getSummary(result),
  }
}
