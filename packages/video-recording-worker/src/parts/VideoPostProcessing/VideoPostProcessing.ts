import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'
import * as Assert from '../Assert/Assert.ts'
import * as Exec from '../Exec/Exec.ts'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.ts'
import * as Root from '../Root/Root.ts'
import * as TestStatus from '../TestStatus/TestStatus.ts'

interface TestEvent {
  timestamp: number
  testName: string
  status: 'running' | 'passed' | 'failed'
}

interface VideoMetadata {
  testEvents: TestEvent[]
  duration: number
}

export const getTestStatusOverlayFilter = (testEvents: TestEvent[], duration: number): string => {
  let filter = ''

  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i]
    const nextEvent = testEvents[i + 1]
    const endTime = nextEvent ? nextEvent.timestamp : duration

    const statusIcon = event.status === 'running' ? '⏳' : event.status === 'passed' ? '✅' : '❌'
    const text = `${event.testName} ${statusIcon}`

    // Create a conditional text overlay for this time range
    const condition = `between(t,${event.timestamp},${endTime})`
    const drawtext = `drawtext=text='${text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.8:boxborderw=5:enable='${condition}'`

    if (filter) {
      filter += `,${drawtext}`
    } else {
      filter = drawtext
    }
  }

  return filter
}

const supportsNativeFfmpeg = (): boolean => {
  return existsSync('/usr/bin/ffmpeg')
}

const getPlaywrightFfmpegPath = (): string => {
  const executablePath = GetExecutablePath.getExecutablePath('ffmpeg')
  return join(Root.root, '.vscode-ffmpeg', ...executablePath)
}

export const addTestStatusBanner = async (inputFile: string, outputFile: string, testEvents: TestEvent[]): Promise<void> => {
  Assert.string(inputFile)
  Assert.string(outputFile)

  // Use system ffmpeg for post-processing since Playwright ffmpeg doesn't support drawtext
  const ffmpegPath = '/usr/bin/ffmpeg'
  if (!existsSync(ffmpegPath)) {
    console.log('System ffmpeg not available for post-processing, skipping banner')
    return
  }

  if (testEvents.length === 0) {
    console.log('No test events to process, skipping banner')
    return
  }

  // Get video duration by parsing ffmpeg output
  let duration = 10 // fallback duration
  try {
    const durationResult = await Exec.exec(ffmpegPath, ['-i', inputFile, '-f', 'null', '-'])
    const durationMatch = durationResult.stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
    if (durationMatch) {
      const hours = parseInt(durationMatch[1])
      const minutes = parseInt(durationMatch[2])
      const seconds = parseFloat(durationMatch[3])
      duration = hours * 3600 + minutes * 60 + seconds
    }
  } catch (error) {
    // Parse duration from error output
    const durationMatch = error.stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
    if (durationMatch) {
      const hours = parseInt(durationMatch[1])
      const minutes = parseInt(durationMatch[2])
      const seconds = parseFloat(durationMatch[3])
      duration = hours * 3600 + minutes * 60 + seconds
    }
  }

  const filter = getTestStatusOverlayFilter(testEvents, duration)

  const args = [
    '-i',
    inputFile,
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23',
    '-y',
    outputFile,
  ]

  await Exec.exec(ffmpegPath, args)
}

export const createTestEvent = (testName: string, status: 'running' | 'passed' | 'failed', timestamp: number): TestEvent => {
  Assert.string(testName)
  Assert.string(status)
  Assert.number(timestamp)

  return {
    testName,
    status,
    timestamp,
  }
}
