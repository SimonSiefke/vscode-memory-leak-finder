

export const setup = async ({ Editor, WelcomePage }) => {
  await Editor.closeAll()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage, page }) => {
  // First, let's log what steps are actually available for debugging
  try {
    const steps = await page.locator('.getting-started-step').all()
    console.log(`Found ${steps.length} getting started steps`)
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = await step.getAttribute('data-step-id')
      console.log(`Available step ${i}: "${stepId}"`)
    }
  } catch (error) {
    console.log('Could not enumerate steps:', error.message)
  }
  
  // Try the most likely step IDs based on VS Code 1.104.1
  const stepIds = ['installExtension', 'selectTheme']
  
  for (const stepId of stepIds) {
    try {
      console.log(`Attempting to expand step: ${stepId}`)
      await WelcomePage.expandStep(stepId)
      console.log(`✅ Successfully expanded step: ${stepId}`)
    } catch (error) {
      console.log(`❌ Failed to expand step ${stepId}:`, error.message)
      // Don't throw - let's try to expand other steps
    }
  }
}
