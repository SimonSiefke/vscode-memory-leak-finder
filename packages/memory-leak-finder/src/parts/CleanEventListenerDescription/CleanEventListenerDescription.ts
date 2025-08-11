import * as DescriptionConversions from '../DescriptionConversions/DescriptionConversions.js'

export const cleanEventListenerDescription = (description) => {
  for (const descriptionConversion of DescriptionConversions.descriptionConversions) {
    if (descriptionConversion.from === description) {
      return descriptionConversion.to
    }
  }
  return description
}
