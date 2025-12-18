import Browsers from '../Browsers/Browsers.json' with { type: 'json' }

export const load = (): any[] => {
  return Browsers.browsers
}
