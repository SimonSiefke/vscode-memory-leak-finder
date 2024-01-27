import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.js'
import * as SourceMapWorkerCommandType from '../SourceMapWorkerCommandType/SourceMapWorkerCommandType.js'

export const commandMap = {
  [SourceMapWorkerCommandType.GetCleanPositionsMap]: GetCleanPositionsMap.getCleanPositionsMap,
}
