import * as SourceMap from '../SourceMap/SourceMap.js'
import * as SourceMapWorkerCommandType from '../SourceMapWorkerCommandType/SourceMapWorkerCommandType.js'

export const commandMap = {
  [SourceMapWorkerCommandType.GetOrignalPositions]: SourceMap.getOriginalPositions,
}
