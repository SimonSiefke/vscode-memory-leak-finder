import * as GetCountData from '../GetCountData/GetCountData.js'

export const getEditContextCountData = () => {
  return GetCountData.getCountData('edit-context-count', 'editContextCount')
}
