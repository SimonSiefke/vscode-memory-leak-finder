import type { Dynamic, MeasureContext } from '../Types/Types.ts'

export interface ActiveAsyncResourcesReport {
  readonly isLeak: boolean
  readonly resources: readonly Dynamic[]
}

export const compareActiveAsyncResources = (
  _before: unknown,
  after: readonly Dynamic[],
  context: MeasureContext,
): ActiveAsyncResourcesReport => {
  const minimumCount = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  const resources = after.filter((item) => typeof item?.count === 'number' && item.count >= minimumCount)
  return { isLeak: resources.length > 0, resources }
}
