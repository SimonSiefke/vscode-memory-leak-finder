import * as GetCountData from '../GetCountData/GetCountData.js'

export const getStringCountData = () => {
  return GetCountData.getCountData('string-count', 'stringCount')
}
