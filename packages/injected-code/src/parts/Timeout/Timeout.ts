export const short = async () => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, 1000)
  await promise
}

const waitForTimeout = (maxDelay: number) => {
  const { promise, resolve } = Promise.withResolvers<void>()
  const timeout = setTimeout(resolve, maxDelay)
  const dispose = () => {
    clearTimeout(timeout)
  }
  return { promise, [Symbol.dispose]: dispose }
}

const waitForMutationInternal = () => {
  const { promise, resolve } = Promise.withResolvers<void>()
  const callback = () => {
    resolve()
  }
  const observer = new MutationObserver(callback)
  observer.observe(document.body, {
    attributeOldValue: true,
    attributes: true,
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
  })
  const dispose = () => {
    observer.disconnect()
  }
  return { promise, [Symbol.dispose]: dispose }
}

export const waitForMutation = async (element: any, maxDelay: number) => {
  const item1 = waitForTimeout(maxDelay)
  const item2 = waitForMutationInternal()
  await Promise.race([item1.promise, item2.promise])
  item1[Symbol.dispose]()
  item2[Symbol.dispose]()
}
