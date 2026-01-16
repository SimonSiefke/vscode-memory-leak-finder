import parser from '@babel/parser'
import generate from '@babel/generator'
import { trackingCode } from '../TrackingCode/TrackingCode.js'

export const addTrackingPreamble = async (code: string): Promise<string> => {
  try {
    // Parse the tracking code
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Parse the original code
    const originalAST = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Combine tracking code with original code
    const combinedAST = {
      type: 'Program',
      body: [...trackingAST.program.body, ...originalAST.program.body]
    }
    
    const result = (generate as any)(combinedAST, {
      retainLines: false,
      compact: false
    })
    
    return result.code
  } catch (error) {
    console.error('Error adding tracking preamble:', error)
    return code // Return original code if preamble addition fails
  }
}
