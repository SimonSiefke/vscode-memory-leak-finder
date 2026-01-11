import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const partitionArray = async (session: Session, objectGroup, objectId, chunkSize) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.string(objectId)
  Assert.number(chunkSize)
  const smallerArraysDescriptor = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `
function () {
  const array = this
  const smallerArrays = []
  const chunkSize = ${chunkSize}
  for(let i = 0; i < array.length; i+= chunkSize){
    const startIndex = i;
    const endIndex = startIndex + chunkSize
    const subArray = array.slice(startIndex, endIndex)
    smallerArrays.push(subArray)
  }
  return smallerArrays
}`,
    objectGroup,
    objectId,
    returnByValue: false,
  })
  return smallerArraysDescriptor
}
