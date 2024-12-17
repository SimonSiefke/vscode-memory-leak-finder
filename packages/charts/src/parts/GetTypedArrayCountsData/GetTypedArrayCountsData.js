import * as GetCountData from '../GetCountData/GetCountData.js'

export const getTypedArrayCountsData = () => {
  return GetCountData.getCountData('typed-array-count', 'typedArrayCount')
}
