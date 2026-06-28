import type { Dynamic } from '../Types/Types.ts'
import * as DescriptionConversions from '../DescriptionConversions/DescriptionConversions.ts'
export const cleanEventListenerDescription = (description: Dynamic) => {
  for (const descriptionConversion of DescriptionConversions.descriptionConversions) {
    if (descriptionConversion.from === description) {
      return descriptionConversion.to
    }
  }
  return description
}
