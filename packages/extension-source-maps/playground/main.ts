import { config } from '../src/parts/Config/Config.ts'
import * as GenerateExtensionSourceMaps from '../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'

const main = async (): Promise<void> => {
  for (const item of config) {
    await GenerateExtensionSourceMaps.generateExtensionSourceMaps(item)
  }
}

main()
