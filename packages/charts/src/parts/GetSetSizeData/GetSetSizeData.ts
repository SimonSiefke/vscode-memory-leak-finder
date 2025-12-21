import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getSetSizeData = (basePath: string) => {
  return GetCountData.getCountData('set-size', 'setSize', basePath)
}
