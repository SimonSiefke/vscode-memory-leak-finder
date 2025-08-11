import * as CompareHeapUsage from '../CompareHeapUsage/CompareHeapUsage.js'
import * as GetHeapUsage from '../GetHeapUsage/GetHeapUsage.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.HeapUsage

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
