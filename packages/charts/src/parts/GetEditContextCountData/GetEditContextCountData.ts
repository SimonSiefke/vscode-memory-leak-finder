import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEditContextCountData = () => {
  return GetCountData.getCountData('edit-context-count', 'editContextCount')
}
