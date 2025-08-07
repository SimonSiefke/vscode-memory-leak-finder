import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getRegexCountData = () => {
  return GetCountData.getCountData('regex-count', 'regexCount')
}
