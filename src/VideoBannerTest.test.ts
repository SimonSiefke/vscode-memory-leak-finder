export const run = async (context) => {
  console.log('Starting video banner test...')
  
  // Simulate test running
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Test running...')
  
  // Simulate test passing
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Test passed!')
  
  // Simulate another test running
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Another test running...')
  
  // Simulate test failing
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Test failed!')
  
  console.log('Video banner test completed!')
}
