import * as Parts from './parts/Parts/Parts.js'

export const create = ({ page, expect, VError, child }) => {
  const api = Object.create(null)
  for (const [key, value] of Object.entries(Parts)) {
    if (key === 'WellKnownCommands') {
      api[key] = value
    } else {
      // @ts-ignore
      api[key] = value.create({ page, expect, VError, child })
    }
  }
  return api
}
