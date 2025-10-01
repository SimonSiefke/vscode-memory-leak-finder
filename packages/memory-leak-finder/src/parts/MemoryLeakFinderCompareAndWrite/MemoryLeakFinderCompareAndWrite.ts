import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as Assert from '../Assert/Assert.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import { join } from 'node:path'

export const compareAndWrite = async (
  connectionId: number, 
  context: any, 
  resultPath: string
): Promise<{ isLeak: boolean }> => {
  Assert.number(connectionId)
  Assert.string(resultPath)
  LogMemoryUsage.logMemoryUsage(`starting memory leak comparison and write for connection ${connectionId}`)
  
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
  
  // Write result directly to disk
  LogMemoryUsage.logMemoryUsage(`writing result to disk: ${resultPath}`)
  await JsonFile.writeJson(resultPath, result)
  LogMemoryUsage.logMemoryUsage(`result written to disk for connection ${connectionId}`)
  
  // Return only the essential information
  return { isLeak: result.isLeak || false }
}
