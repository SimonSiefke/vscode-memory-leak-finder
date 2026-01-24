import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'
import * as SourceMapWorkerCommandType from '../SourceMapWorkerCommandType/SourceMapWorkerCommandType.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  [SourceMapWorkerCommandType.GetCleanPositionsMap]: GetCleanPositionsMap.getCleanPositionsMap,
}
