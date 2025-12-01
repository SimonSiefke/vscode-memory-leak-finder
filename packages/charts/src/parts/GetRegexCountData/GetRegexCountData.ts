import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getRegexCountData = (basePath: string) => {
  return GetCountData.getCountData('regex-count', 'regexCount', basePath)
}
