import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'

const doStartWithWorkers = async (instanceId: string): Promise<Record<string, any>> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  
  const results: Record<string, any> = {}
  
  // Measure main page
  const pageSession = SessionState.getPageSession()
  if (pageSession) {
    results.main = await measure.start()
  }
  
  // Measure all worker targets
  const allSessions = SessionState.getAllSessions()
  const workerSessions = allSessions.filter(session => session.type === 'worker')
  
  for (const workerSession of workerSessions) {
    const target = Object.values(TargetState.state.targets).find(t => t.sessionId === workerSession.sessionId)
    if (target) {
      const workerName = target.title || target.url || `worker-${target.targetId}`
      // Create a new measure instance for this worker session using the same measure type
      const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
      const measureId = measure.id
      const measureClass = Object.values(MemoryLeakFinder.Measures).find(m => m.id === measureId)
      if (measureClass) {
        const workerMeasure = measureClass.create(workerSession.rpc)
        results[workerName] = await workerMeasure.start()
      }
    }
  }
  
  return results
}

export const startWithWorkers = async (instanceId: string, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStartWithWorkers(instanceId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && (intermediateResult as any).crashed) {
    throw new Error('target crashed')
  }
  crashInfo.cleanup()
  return intermediateResult
}
