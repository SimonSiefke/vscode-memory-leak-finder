import * as GetImageBitmapCountsData from '../GetImageBitmapCountsData/GetImageBitmapCountsData.ts'

export const name = 'image-bitmap-count'

export const getData = (basePath: string): Promise<any[]> => GetImageBitmapCountsData.getImageBitmapCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Image Bitmap Count',
  }
}

