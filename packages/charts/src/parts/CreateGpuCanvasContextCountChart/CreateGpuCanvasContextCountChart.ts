import * as GetGpuCanvasContextCountsData from '../GetGpuCanvasContextCountsData/GetGpuCanvasContextCountsData.ts'

export const name = 'gpu-canvas-context-count'

export const getData = (basePath: string) => GetGpuCanvasContextCountsData.getGpuCanvasContextCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'GPU Canvas Context Count',
  }
}

