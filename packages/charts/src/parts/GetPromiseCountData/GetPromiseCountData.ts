import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getPromiseCountData = (basePath: string) => {
  return GetCountData.getCountData('promise-count', 'promiseCount', basePath)
}
