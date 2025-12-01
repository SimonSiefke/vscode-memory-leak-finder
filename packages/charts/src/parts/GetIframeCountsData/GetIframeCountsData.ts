import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getIframeCountsData = (basePath: string) => {
  return GetCountData.getCountData('iframe-count', 'iframeCount', basePath)
}
