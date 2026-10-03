import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'
import * as GetOriginalClassNameFromFile from '../GetOriginalClassNameFromFile/GetOriginalClassNameFromFile.ts'
import { getOriginalClassNameFromFiles } from '../GetOriginalClassNameFromFiles/GetOriginalClassNameFromFiles.ts'
import * as GetOriginalConstructorName from '../GetOriginalConstructorName/GetOriginalConstructorName.ts'
import * as GetOriginalConstructorNameFromFile from '../GetOriginalConstructorNameFromFile/GetOriginalConstructorNameFromFile.ts'
import { getOriginalConstructorNameFromFiles } from '../GetOriginalConstructorNameFromFiles/GetOriginalConstructorNameFromFiles.ts'

export const commandMap: Record<string, any> = {
  'OriginalName.getOriginalName': GetOriginalClassName.getOriginalClassName,
  'OriginalName.getOriginalNameFromFile': GetOriginalClassNameFromFile.getOriginalClassNameFromFile,
  'OriginalName.getOriginalNameFromFiles': getOriginalClassNameFromFiles,
  'OriginalName.getOriginalConstructorName': GetOriginalConstructorName.getOriginalConstructorName,
  'OriginalName.getOriginalConstructorNameFromFile': GetOriginalConstructorNameFromFile.getOriginalConstructorNameFromFile,
  'OriginalName.getOriginalConstructorNameFromFiles': getOriginalConstructorNameFromFiles,
}
