import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getPromiseCountData = () => {
  return GetCountData.getCountData('promise-count', 'promiseCount')
}
