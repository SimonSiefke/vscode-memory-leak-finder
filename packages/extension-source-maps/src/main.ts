import { config } from './parts/Config/Config.ts'
import * as GenerateExtensionSourceMaps from './parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'

const main = async (): Promise<void> => {
  for (const item of config) {
    await GenerateExtensionSourceMaps.generateExtensionSourceMaps(item)
  }
}

main()
