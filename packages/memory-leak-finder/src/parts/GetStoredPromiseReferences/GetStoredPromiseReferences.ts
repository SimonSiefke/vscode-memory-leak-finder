import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export interface StoredPromiseReference {
  readonly count: number
  readonly owner: string
  readonly property: string
}

export const getStoredPromiseReferences = async (session: Session, objectGroup: string): Promise<readonly StoredPromiseReference[]> => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  return DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const counts = Object.create(null)
  for (const object of this) {
    // queryObjects returns its matches in this array. Do not count the
    // inspector's own references as application-owned Promise references.
    if (object === this) {
      continue
    }
    let keys
    try {
      keys = Reflect.ownKeys(object)
    } catch {
      continue
    }
    for (const key of keys) {
      let descriptor
      try {
        descriptor = Object.getOwnPropertyDescriptor(object, key)
      } catch {
        continue
      }
      if (!descriptor || !(descriptor.value instanceof Promise)) {
        continue
      }
      let owner = 'Object'
      try {
        owner = object.constructor?.name || owner
      } catch {}
      const property = typeof key === 'string' && /^\\d+$/.test(key) ? '[index]' : String(key)
      const id = owner + '\\u0000' + property
      const existing = counts[id]
      if (existing) {
        existing.count++
      } else {
        counts[id] = { count: 1, owner, property }
      }
    }
  }
  return Object.values(counts)
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
}
