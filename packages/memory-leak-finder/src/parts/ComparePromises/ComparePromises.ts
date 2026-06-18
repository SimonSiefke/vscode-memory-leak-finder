import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
const isPropertyPromiseState = (property: Dynamic) => {
  return property.name === '[[PromiseState]]'
}
const isPropertyPromiseResult = (property: Dynamic) => {
  return property.name === '[[PromiseResult]]'
}
const getPropertyPromiseState = (properties: Dynamic) => {
  return properties.find(isPropertyPromiseState)
}
const getPropertyPromiseResult = (properties: Dynamic) => {
  return properties.find(isPropertyPromiseResult)
}
const prettifyPromise = (promise: Dynamic) => {
  const { preview } = promise
  const { properties } = preview
  const state = getPropertyPromiseState(properties)
  const result = getPropertyPromiseResult(properties)
  return {
    result,
    state,
  }
}
export const comparePromises = (before: Dynamic, after: Dynamic) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = before.map(prettifyPromise)
  const prettyAfter = after.map(prettifyPromise)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
