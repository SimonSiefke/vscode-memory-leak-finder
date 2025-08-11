import * as ExpectPageIndex from '../ExpectPageIndex/ExpectPageIndex.js'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.js'

function ExpectPage(page) {
  this.context = page
}

RegisterPrototype.registerPrototype(ExpectPage, ExpectPageIndex)

export const expect = (page) => {
  return new ExpectPage(page)
}
