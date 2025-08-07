import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getIframeCountsData = () => {
  return GetCountData.getCountData('iframe-count', 'iframeCount')
}
