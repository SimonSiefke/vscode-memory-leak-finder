import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import type { HeapUsageSnapshot } from '../CompareHeapUsage/CompareHeapUsage.ts'
import * as CompareHeapUsage from '../CompareHeapUsage/CompareHeapUsage.ts'
import * as GetHeapUsage from '../GetHeapUsage/GetHeapUsage.ts'
import * as GetNodeV8HeapStatistics from '../GetNodeV8HeapStatistics/GetNodeV8HeapStatistics.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = MeasureId.HeapUsage
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export const create = (session: Session) => {
  return [session]
}
// The extra Node.js evaluation runs outside the interval between the two
// CDP heap reads, so it cannot change the legacy usedSize/totalSize values.
export const start = async (session: Session): Promise<HeapUsageSnapshot> => {
  const node = await GetNodeV8HeapStatistics.getNodeV8HeapStatistics(session)
  const heapUsage = await GetHeapUsage.getHeapUsage(session)
  return { ...heapUsage, node }
}
export const stop = async (session: Session): Promise<HeapUsageSnapshot> => {
  const heapUsage = await GetHeapUsage.getHeapUsage(session)
  const node = await GetNodeV8HeapStatistics.getNodeV8HeapStatistics(session)
  return { ...heapUsage, node }
}
export const compare = CompareHeapUsage.compareHeapUsage
export const isLeak = ({ isLeak }: Dynamic) => {
  return isLeak
}
