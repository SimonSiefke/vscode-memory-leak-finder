import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedArrayCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  console.log({ flatScopeList })
  return 0
}
