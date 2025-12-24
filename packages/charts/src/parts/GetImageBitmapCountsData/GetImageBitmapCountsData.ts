import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getImageBitmapCountsData = (basePath: string) => {
  return GetCountData.getCountData('image-bitmap-count', 'imageBitmapCount', basePath)
}
