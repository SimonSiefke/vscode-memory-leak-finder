import * as Assert from '../Assert/Assert.ts'

const isPropertyPromiseState = (property) => {
  return property.name === '[[PromiseState]]'
}

const isPropertyPromiseResult = (property) => {
  return property.name === '[[PromiseResult]]'
}

const getPropertyPromiseState = (properties) => {
  return properties.find(isPropertyPromiseState)
}

const getPropertyPromiseResult = (properties) => {
  return properties.find(isPropertyPromiseResult)
}

const prettifyPromise = (promise) => {
  const { preview, objectId } = promise
  const { properties } = preview
  // console.log({ preview, properties })
  const state = getPropertyPromiseState(properties)
  const result = getPropertyPromiseResult(properties)
  return {
    state,
    result,
  }
}

const getAdded = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.objectId] = true
  }
  const added = []
  for (const item of after) {
    if (item.objectId in beforeMap) {
      // ignore
    } else {
      added.push(item)
    }
  }
  return added
}

export const comparePromisesWithStackTrace = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const leaked = getAdded(before, after)
  return leaked
}
