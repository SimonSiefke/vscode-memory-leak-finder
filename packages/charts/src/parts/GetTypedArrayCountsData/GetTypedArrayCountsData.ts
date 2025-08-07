import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getTypedArrayCountsData = () => {
  return GetCountData.getCountData('typed-array-count', 'typedArrayCount')
}
