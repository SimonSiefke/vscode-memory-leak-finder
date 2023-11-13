import * as Arrays from '../Arrays/Arrays.js'
import * as CompareInstanceCounts from '../CompareInstanceCounts/CompareInstanceCounts.js'
import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.InstanceCounts

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const compare = CompareInstanceCounts.compareInstanceCounts

const getCount = (value) => {
  return value.count
}

const getTotalCount = (instances) => {
  return Arrays.sum(instances.map(getCount))
}

export const isLeak = ({ before, after }) => {
  return getTotalCount(after) > getTotalCount(before)
}
