import type { Session } from '../Session/Session.ts'

export interface TrackedFunctionResult {
  readonly functionName: string
  readonly callCount: number
}

export const compareTrackedFunctions = async (
  before: Record<string, number>,
  after: Record<string, number>,
  _context: Session,
): Promise<readonly TrackedFunctionResult[]> => {
  const results: TrackedFunctionResult[] = []
  
  // Get all unique function names from both before and after
  const allFunctionNames = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])
  
  // Calculate call counts for each function
  for (const functionName of allFunctionNames) {
    const beforeCount = before[functionName] || 0
    const afterCount = after[functionName] || 0
    const callCount = afterCount - beforeCount
    
    if (callCount > 0) {
      results.push({
        functionName,
        callCount,
      })
    }
  }
  
  // Sort by call count descending (highest first)
  results.sort((a, b) => b.callCount - a.callCount)
  
  return results
}
