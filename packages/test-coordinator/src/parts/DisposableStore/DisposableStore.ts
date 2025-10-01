export class DisposableStore {
  disposables: any
  isDisposed: boolean

  constructor() {
    this.disposables = new Set()
    this.isDisposed = false
  }

  add(fn) {
    if (this.isDisposed) {
      throw new Error(`cannot add to disposed disposable store`)
    }
    this.disposables.add(fn)
  }

  async dispose() {
    if (this.isDisposed) {
      throw new Error(`cannot dispose disposable store multiple times`)
    }
    this.isDisposed = true
    for (const item of this.disposables) {
      await item.dispose()
    }
  }
}
