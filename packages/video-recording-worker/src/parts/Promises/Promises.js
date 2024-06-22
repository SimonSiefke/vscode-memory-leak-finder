export const withResolvers = () => {
  /**
   * @type {any}
   */
  let _resolve
  /**
   * @type {any}
   */
  let _reject
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
  return {
    resolve: _resolve,
    reject: _reject,
    promise,
  }
}
