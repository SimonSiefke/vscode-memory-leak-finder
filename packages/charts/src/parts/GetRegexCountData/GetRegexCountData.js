import * as GetCountData from '../GetCountData/GetCountData.js'

export const getRegexCountData = () => {
  return GetCountData.getCountData('regex-count', 'regexCount')
}
