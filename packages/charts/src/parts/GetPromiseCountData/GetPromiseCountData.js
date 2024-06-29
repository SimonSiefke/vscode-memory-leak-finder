import * as GetCountData from '../GetCountData/GetCountData.js'

export const getPromiseCountData = () => {
  return GetCountData.getCountData('promise-count', 'promiseCount')
}
