import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMediaQueryListCountData = (basePath: string) => {
  return GetCountData.getCountData('media-query-list-count', 'mediaQueryListCount', basePath)
}
