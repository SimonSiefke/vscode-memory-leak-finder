import { VError } from '@lvce-editor/verror'
import type { Session } from '../Session/Session.ts'
import * as GetObjects from '../GetObjects/GetObjects.ts'
import * as GetPropertyValues from '../GetPropertyValues/GetPropertyValues.ts'
import * as IsProxy from '../IsProxy/IsProxy.ts'

export const getProxyCount = async (session: Session, objectGroup: string): Promise<number> => {
  try {
    const objects = await GetObjects.getObjects(session, objectGroup)
    const values = await GetPropertyValues.getPropertyValues(session, objectGroup, objects.objectId)
    const proxies = values.filter(IsProxy.isProxy)
    const proxyCount = proxies.length
    return proxyCount
  } catch (error) {
    throw new VError(error, `Failed to get proxy count`)
  }
}
