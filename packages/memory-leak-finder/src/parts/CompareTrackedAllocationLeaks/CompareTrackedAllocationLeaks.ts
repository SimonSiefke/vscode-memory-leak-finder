import type { Session } from '../Session/Session.ts'
import * as CompareTrackedAllocations from '../CompareTrackedAllocations/CompareTrackedAllocations.ts'

export const compareTrackedAllocationLeaks = async (
  before: Parameters<typeof CompareTrackedAllocations.compareTrackedAllocations>[0],
  after: Parameters<typeof CompareTrackedAllocations.compareTrackedAllocations>[1],
  context: Session,
): Promise<readonly CompareTrackedAllocations.TrackedAllocationResult[]> => {
  const allocations = await CompareTrackedAllocations.compareTrackedAllocations(before, after, context)
  return allocations
    .filter((allocation) => allocation.aliveCount > 0)
    .toSorted((a, b) => b.aliveCount - a.aliveCount || b.createdCount - a.createdCount || a.location.localeCompare(b.location))
}
