import * as Assert from '../Assert/Assert.js'

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
  const { preview } = promise
  const { properties } = preview
  const state = getPropertyPromiseState(properties)
  const result = getPropertyPromiseResult(properties)
  return {
    state,
    result,
  }
}

export const comparePromises = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = before.map(prettifyPromise)
  const prettyAfter = after.map(prettifyPromise)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
