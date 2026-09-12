import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getConcatenatedErrorStringCountData = (basePath: string) => {
  return GetCountData.getCountData('concatenated-error-string-count', 'concatenatedErrorStringCount', basePath)
}
