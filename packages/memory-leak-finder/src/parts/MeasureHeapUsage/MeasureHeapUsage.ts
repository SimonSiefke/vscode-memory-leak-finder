import * as CompareHeapUsage from '../CompareHeapUsage/CompareHeapUsage.ts'
import * as GetHeapUsage from '../GetHeapUsage/GetHeapUsage.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.HeapUsage

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetHeapUsage.getHeapUsage(session)
}

export const stop = (session) => {
  return GetHeapUsage.getHeapUsage(session)
}

export const compare = CompareHeapUsage.compareHeapUsage

export const isLeak = () => {
  return false
}
