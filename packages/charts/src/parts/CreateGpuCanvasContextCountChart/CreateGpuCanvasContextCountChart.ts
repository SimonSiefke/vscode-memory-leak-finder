import * as GetGpuCanvasContextCountsData from '../GetGpuCanvasContextCountsData/GetGpuCanvasContextCountsData.ts'

export const name = 'gpu-canvas-context-count'

export const getData = (basePath: string): Promise<any[]> => GetGpuCanvasContextCountsData.getGpuCanvasContextCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'GPU Canvas Context Count',
  }
}

