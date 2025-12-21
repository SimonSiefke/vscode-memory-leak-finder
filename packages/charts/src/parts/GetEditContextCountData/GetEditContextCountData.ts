import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEditContextCountData = (basePath: string) => {
  return GetCountData.getCountData('edit-context-count', 'editContextCount', basePath)
}
