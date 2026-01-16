import { trackingCode } from '../TrackingCode/TrackingCode.js'

export const addTrackingPreamble = (code: string): string => {
  return trackingCode + '\n' + code
}
