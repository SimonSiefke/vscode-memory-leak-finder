export const withResolvers = <T = unknown>(): {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (reason?: unknown) => void
} => {
  let _resolve: (value: T) => void
  let _reject: (reason?: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
  return {
    resolve: _resolve!,
    reject: _reject!,
    promise,
  }
}
