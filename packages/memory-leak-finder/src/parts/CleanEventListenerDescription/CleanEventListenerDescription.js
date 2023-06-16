import * as DescriptionConversions from '../DescriptionConversions/DescriptionConversions.js'
import * as DescriptionString from '../DescriptionString/DescriptionString.js'
import * as IsReactInternalFunction from '../IsReactInternalFunction/IsReactInternalFunction.js'

export const cleanEventListenerDescription = (description) => {
  for (const descriptionConversion of DescriptionConversions.descriptionConversions) {
    if (descriptionConversion.from === description) {
      return descriptionConversion.to
    }
  }
  if (IsReactInternalFunction.isReactInternalFunction(description)) {
    return DescriptionString.ReactInternalFunction
  }
  return description
}
