import * as GetCountData from '../GetCountData/GetCountData.js'

export const getIframeCountsData = () => {
  return GetCountData.getCountData('iframe-count', 'iframeCount')
}
