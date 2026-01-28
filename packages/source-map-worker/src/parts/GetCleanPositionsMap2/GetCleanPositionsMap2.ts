import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as SourceMap from '../SourceMap/SourceMap.ts'

export const getCleanPositionsMap2 = async (
  sourceMap: any,
  value: readonly number[],
  classNames: boolean,
  hash: string,
  key: string,
): Promise<readonly any[]> => {
  const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value, classNames, hash, key)
  const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
  return cleanPositions
}
