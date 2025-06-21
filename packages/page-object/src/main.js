<<<<<<< HEAD
import * as Parts from './parts/Parts/Parts.js'

const parseVersion = (version) => {
  const parts = version.split('.')
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
    patch: parseInt(parts[2]),
  }
}

const getIdeVersion = async () => {
  // packages / test - coordinator / src / parts / VsCodeVersion / VsCodeVersion.js
  const moduleUri = new URL('../../../packages/test-coordinator/src/parts/VsCodeVersion/VsCodeVersion.js', import.meta.url).toString()
  const module = await import(moduleUri)
  const version = module.vscodeVersion
  return parseVersion(version)
}

// TODO pass ide version as parameter context

export const create = async (context) => {
  const api = Object.create(null)
  const ideVersion = await getIdeVersion()
  const actualContext = {
    ...context,
    ideVersion,
  }
  for (const [key, value] of Object.entries(Parts)) {
    if (key === 'WellKnownCommands') {
      api[key] = value
    } else {
      // @ts-ignore
      api[key] = value.create(actualContext)
    }
  }
  return api
}
=======
export { create } from './parts/Create/Create.js'
>>>>>>> origin/main
