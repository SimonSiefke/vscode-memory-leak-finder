import * as Assert from '../Assert/Assert.ts'

export const registerPrototype = (constructor: any, object: any) => {
  for (const [key, value] of Object.entries(object)) {
    constructor.prototype[key] = function (...args: any[]) {
      const { context } = this
      Assert.object(context)
      // @ts-ignore
      return value(context, ...args)
    }
  }
}
