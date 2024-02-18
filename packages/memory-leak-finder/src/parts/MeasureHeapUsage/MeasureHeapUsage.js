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

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = () => {
  return false
}
