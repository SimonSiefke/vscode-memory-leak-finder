import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getStringCountData = () => {
  return GetCountData.getCountData('string-count', 'stringCount')
}
