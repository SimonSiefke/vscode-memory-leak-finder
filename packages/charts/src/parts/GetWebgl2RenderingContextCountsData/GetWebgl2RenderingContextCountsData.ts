import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWebgl2RenderingContextCountsData = (basePath: string) => {
  return GetCountData.getCountData('webgl2-rendering-context-count', 'webgl2RenderingContextCount', basePath)
}
