import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as Assert from '../Assert/Assert.js'

export const partitionArray = async (session, objectGroup, objectId, chunkSize) => {
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
    returnByValue: false,
    objectGroup,
    objectId,
  })
  return smallerArraysDescriptor
}
