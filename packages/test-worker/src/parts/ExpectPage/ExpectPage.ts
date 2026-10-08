import * as ExpectPageIndex from '../ExpectPageIndex/ExpectPageIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectPage(this: { context: any }, page: any) {
  this.context = page
}

RegisterPrototype.registerPrototype(ExpectPage, ExpectPageIndex)

export const expect = (page: any) => {
  return new (ExpectPage as unknown as new (page: any) => any)(page)
}
