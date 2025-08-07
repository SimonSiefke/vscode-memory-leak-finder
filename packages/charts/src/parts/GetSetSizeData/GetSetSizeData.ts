import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getSetSizeData = () => {
  return GetCountData.getCountData('set-size', 'setSize')
}
