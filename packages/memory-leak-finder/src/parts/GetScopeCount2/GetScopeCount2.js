import * as Assert from '../Assert/Assert.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'

export const getScopeCount2 = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const objectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)

  console.log({ objectIds })
  return []
}
