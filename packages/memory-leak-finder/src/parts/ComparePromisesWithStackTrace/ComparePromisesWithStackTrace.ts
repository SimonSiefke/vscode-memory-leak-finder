import * as Assert from '../Assert/Assert.ts'
import * as Hash from '../Hash/Hash.ts'

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

const hashPromise = (item) => {
  const { preview, stackTrace } = item
  const { properties } = preview
  return Hash.hash({
    properties,
    stackTrace,
  })
}

const getAdded = (before, after) => {
  const map = Object.create(null)
  for (const item of before) {
    const hash = hashPromise(item)
    map[hash] ||= 0
    map[hash]++
  }
  const leaked = []
  for (const item of after) {
    const hash = hashPromise(item)
    if (map[hash]) {
      map[hash]--
    } else {
      leaked.push(item)
    }
  }
  return leaked
}

const cleanItem = (item) => {
  const { preview, stackTrace } = item
  const { properties } = preview
  return {
    properties,
    stackTrace: stackTrace.split('\n'),
  }
}

const clean = (items) => {
  return items.map(cleanItem)
}

export const comparePromisesWithStackTrace = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const leaked = getAdded(before, after)
  const cleanLeaked = clean(leaked)
  return cleanLeaked
}
