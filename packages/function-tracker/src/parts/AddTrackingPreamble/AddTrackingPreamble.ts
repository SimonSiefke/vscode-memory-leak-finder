import { trackingCode } from '../TrackingCode/TrackingCode.js'

export const addTrackingPreamble = async (code: string): Promise<string> => {
  try {
    return trackingCode + '\n' + code
  } catch (error) {
    console.error('Error adding tracking preamble:', error)
    return code // Return original code if preamble addition fails
  }
}
