import * as CompareMapLeak from '../CompareMapLeak/CompareMapLeak.js'
import * as GetEventTargetKey from '../GetEventTargetKey/GetEventTargetKey.js'

export const compareEventTargets = (before, after) => {
  const leaked = CompareMapLeak.compareMapLeak(before, after, GetEventTargetKey.getEventTargetKey)
  return leaked
}
