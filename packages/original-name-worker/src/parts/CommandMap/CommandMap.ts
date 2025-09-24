import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'
import * as GetOriginalClassNameFromFile from '../GetOriginalClassNameFromFile/GetOriginalClassNameFromFile.ts'

export const commandMap: Record<string, any> = {
  'OriginalName.getOriginalName': GetOriginalClassName.getOriginalClassName,
  'OriginalName.getOriginalNameFromFile': GetOriginalClassNameFromFile.getOriginalClassNameFromFile,
}
