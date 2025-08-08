import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

const doCompareWithWorkers = async (instanceId: string, before: any, after: any): Promise<any> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  
  const resultMap = {}
  let hasLeak = false
  
  // Compare main page
  if (before.main !== undefined && after.main !== undefined) {
    const delta = after.main - before.main
    const isLeak = delta > 0
    if (isLeak) hasLeak = true
    resultMap.main = {
      before: before.main,
      after: after.main,
      delta,
      isLeak,
    }
  }
  
  // Compare workers
  const allWorkerNames = new Set([
    ...Object.keys(before).filter(key => key !== 'main'),
    ...Object.keys(after).filter(key => key !== 'main')
  ])
  
  for (const workerName of allWorkerNames) {
    const beforeCount = before[workerName] || 0
    const afterCount = after[workerName] || 0
    const delta = afterCount - beforeCount
    const isLeak = delta > 0
    if (isLeak) hasLeak = true
    resultMap[workerName] = {
      before: beforeCount,
      after: afterCount,
      delta,
      isLeak,
    }
  }
  
  return {
    ...resultMap,
    isLeak: hasLeak,
  }
}

export const compareWithWorkers = async (instanceId: string, before: any, after: any): Promise<any> => {
  return await doCompareWithWorkers(instanceId, before, after)
}
