import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'
import { getCleanPositionsMap2 } from '../GetCleanPositionsMap2/GetCleanPositionsMap2.ts'
import * as SourceMapWorkerCommandType from '../SourceMapWorkerCommandType/SourceMapWorkerCommandType.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  [SourceMapWorkerCommandType.GetCleanPositionsMap]: GetCleanPositionsMap.getCleanPositionsMap,
  [SourceMapWorkerCommandType.GetCleanPositionsMap2]: getCleanPositionsMap2,
}
