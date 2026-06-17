import * as Assert from '../Assert/Assert.ts'

const isPropertyPromiseState = (property: { name: string }): boolean => {
  return property.name === '[[PromiseState]]'
}

const isPropertyPromiseResult = (property: { name: string }): boolean => {
  return property.name === '[[PromiseResult]]'
}

const getPropertyPromiseState = (properties: readonly { name: string }[]): { name: string } | undefined => {
  return properties.find(isPropertyPromiseState)
}

const getPropertyPromiseResult = (properties: readonly { name: string }[]): { name: string } | undefined => {
  return properties.find(isPropertyPromiseResult)
}

const prettifyPromise = (promise: { preview: { properties: readonly { name: string }[] } }): { result: { name: string } | undefined; state: { name: string } | undefined } => {
  const { preview } = promise
  const { properties } = preview
  const state = getPropertyPromiseState(properties)
  const result = getPropertyPromiseResult(properties)
  return {
    result,
    state,
  }
}

export const comparePromises = (before: unknown, after: unknown): { after: readonly { result: { name: string } | undefined; state: { name: string } | undefined }[]; before: readonly { result: { name: string } | undefined; state: { name: string } | undefined }[] } => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = before.map(prettifyPromise)
  const prettyAfter = after.map(prettifyPromise)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
