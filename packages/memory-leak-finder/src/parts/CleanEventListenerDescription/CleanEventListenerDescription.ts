import * as DescriptionConversions from '../DescriptionConversions/DescriptionConversions.ts'

export const cleanEventListenerDescription = (description: string): string => {
  for (const descriptionConversion of DescriptionConversions.descriptionConversions) {
    if (descriptionConversion.from === description) {
      return descriptionConversion.to
    }
  }
  return description
}
