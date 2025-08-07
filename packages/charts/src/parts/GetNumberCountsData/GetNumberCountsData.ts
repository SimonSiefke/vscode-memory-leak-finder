import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getNumberCountsData = () => {
  return GetCountData.getCountData('number-count', 'numberCount')
}
