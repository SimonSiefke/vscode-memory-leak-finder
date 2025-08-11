import * as ExpectPageIndex from '../ExpectPageIndex/ExpectPageIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectPage(page) {
  this.context = page
}

RegisterPrototype.registerPrototype(ExpectPage, ExpectPageIndex)

export const expect = (page) => {
  return new ExpectPage(page)
}
