import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getGpuCanvasContextCountsData = (basePath: string) => {
  return GetCountData.getCountData('gpu-canvas-context-count', 'gpuCanvasContextCount', basePath)
}
