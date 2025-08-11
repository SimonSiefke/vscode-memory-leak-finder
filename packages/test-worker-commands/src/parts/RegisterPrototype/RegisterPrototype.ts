import * as Assert from '../Assert/Assert.js'

export const registerPrototype = (constructor, object) => {
  for (const [key, value] of Object.entries(object)) {
    constructor.prototype[key] = function (...args) {
      const { context } = this
      Assert.object(context)
      return value(context, ...args)
    }
  }
}
