import * as GetImageBitmapCountsData from '../GetImageBitmapCountsData/GetImageBitmapCountsData.ts'

export const name = 'image-bitmap-count'

export const getData = (basePath: string) => GetImageBitmapCountsData.getImageBitmapCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Image Bitmap Count',
  }
}

