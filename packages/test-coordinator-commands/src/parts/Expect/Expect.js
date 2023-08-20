import * as ExpectDefault from '../ExpectDefault/ExpectDefault.js'
import * as ExpectElectronApp from '../ExpectElectronApp/ExpectElectronApp.js'
import * as ExpectLocator from '../ExpectLocator/ExpectLocator.js'
import * as ExpectPage from '../ExpectPage/ExpectPage.js'
import * as ObjectType from '../ObjectType/ObjectType.js'

export const expect = (args) => {
  const type = args ? args.objectType || args.type || '' : ''
  switch (type) {
    case ObjectType.Locator:
      return ExpectLocator.expect(args)
    case ObjectType.Page:
      return ExpectPage.expect(args)
    case ObjectType.ElectronApp:
      return ExpectElectronApp.expect(args)
    default:
      return ExpectDefault.expect(args)
  }
}
