import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as Assert from '../Assert/Assert.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'

export const compare = async (connectionId: number, context: any, resultPath?: string): Promise<any> => {
  Assert.number(connectionId)
  LogMemoryUsage.logMemoryUsage(`starting memory leak comparison for connection ${connectionId}`)
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
  LogMemoryUsage.logMemoryUsage(`before memory leak comparison for connection ${connectionId}`)
  const result = measure.compare(before, after, context)
  LogMemoryUsage.logMemoryUsage(`after memory leak comparison for connection ${connectionId}`)
  
  // If resultPath is provided, write result to disk and return only essential info
  if (resultPath) {
    LogMemoryUsage.logMemoryUsage(`writing result to disk: ${resultPath}`)
    await JsonFile.writeJson(resultPath, result)
    LogMemoryUsage.logMemoryUsage(`result written to disk for connection ${connectionId}`)
    return { isLeak: result.isLeak || false }
  }
  
  return result
}
