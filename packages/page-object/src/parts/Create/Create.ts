import * as Parts from '../Parts/Parts.ts'

export const create = async (context) => {
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
