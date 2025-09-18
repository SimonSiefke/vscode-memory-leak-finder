import { generateApiTypes } from './generateApiTypes.js'

const main = async (): Promise<void> => {
  try {
    await generateApiTypes()
    process.exit(0)
  } catch (error) {
    console.error('Failed to generate API types:', error)
    process.exit(1)
  }
}

main()
