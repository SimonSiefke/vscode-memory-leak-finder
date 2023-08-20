import * as Parts from './parts/Parts/Parts.js'

export const create = (context) => {
  const api = Object.create(null)
  for (const [key, value] of Object.entries(Parts)) {
    if (key === 'WellKnownCommands') {
      api[key] = value
    } else {
      // @ts-ignore
      api[key] = value.create(context)
    }
  }
  return api
}
