import * as Assert from '../Assert/Assert.ts'

export const registerPrototype = (constructor, object) => {
  for (const [key, value] of Object.entries(object)) {
    constructor.prototype[key] = function (...args) {
      const { context } = this
      Assert.object(context)
      // @ts-ignore
      return value(context, ...args)
    }
  }
}
