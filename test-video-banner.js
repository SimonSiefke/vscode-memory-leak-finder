import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// Test the video post-processing functionality
async function testVideoBanner() {
  console.log('Testing video banner post-processing...')

  const ffmpegPath = '/usr/bin/ffmpeg'

  if (!existsSync(ffmpegPath)) {
    console.log('System ffmpeg not found')
    return
  }

  const inputFile = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-videos/video.webm'
  const outputFile = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-videos/video_with_banner.webm'

  if (!existsSync(inputFile)) {
    console.log('Input video file not found')
    return
  }

  // Test events
  const testEvents = [
    { testName: 'VideoBannerTest', status: 'running', timestamp: 0 },
    { testName: 'VideoBannerTest', status: 'passed', timestamp: 2 },
    { testName: 'AnotherTest', status: 'running', timestamp: 4 },
    { testName: 'AnotherTest', status: 'failed', timestamp: 6 }
  ]

  // Get video duration using ffprobe
  console.log('Getting video duration...')
  let duration = 10 // fallback duration
  try {
    const durationResult = await execAsync(`"${ffmpegPath}" -v quiet -show_entries format=duration -of csv=p=0 "${inputFile}"`)
    duration = parseFloat(durationResult.stdout.trim())
  } catch (error) {
    console.log('Failed to get duration, using fallback')
  }
  console.log(`Video duration: ${duration} seconds`)

  // Create text overlay filter
  let filter = ''
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i]
    const nextEvent = testEvents[i + 1]
    const endTime = nextEvent ? nextEvent.timestamp : duration

    const statusIcon = event.status === 'running' ? '⏳' : event.status === 'passed' ? '✅' : '❌'
    const text = `${event.testName} ${statusIcon}`

    const condition = `between(t,${event.timestamp},${endTime})`
    const drawtext = `drawtext=text='${text}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.8:boxborderw=5:enable='${condition}'`

    if (filter) {
      filter += `,${drawtext}`
    } else {
      filter = drawtext
    }
  }

  console.log('Applying text overlay...')
  console.log(`Filter: ${filter}`)

  const args = [
    '-i', inputFile,
    '-vf', filter,
    '-c:v', 'libvpx-vp8',
    '-crf', '8',
    '-b:v', '1M',
    '-y', outputFile
  ]

  try {
    // Use spawn instead of exec to avoid shell escaping issues
    const ffmpegProcess = spawn(ffmpegPath, args)

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Video with banner created: ${outputFile}`)
      } else {
        console.error(`❌ ffmpeg exited with code ${code}`)
      }
    })

    ffmpegProcess.on('error', (error) => {
      console.error('❌ Error creating video with banner:', error.message)
    })

    // Wait for the process to complete
    await new Promise((resolve, reject) => {
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`))
        }
      })
      ffmpegProcess.on('error', reject)
    })
  } catch (error) {
    console.error('❌ Error creating video with banner:', error.message)
  }
}

testVideoBanner().catch(console.error)
