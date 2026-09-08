const vscode = require('vscode')

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
let speechSessionCount = 0
let speechSessionCancellationCount = 0

class SpeechSessionRaceSample {
  constructor() {
    this.emitter = new vscode.EventEmitter()
    this.onDidChange = this.emitter.event
  }

  synthesize() {}
}

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.lm.registerLanguageModelChatProvider('copilot', {
      provideLanguageModelChatInformation: async () => [
        {
          id: 'speech-session-race-model',
          name: 'Speech Session Race Model',
          family: 'test',
          version: '1.0.0',
          maxInputTokens: 100,
          maxOutputTokens: 100,
          isDefault: true,
          isUserSelectable: true,
          capabilities: {},
        },
      ],
      provideLanguageModelChatResponse: async () => undefined,
      provideTokenCount: async () => 1,
    }),
  )

  context.subscriptions.push(
    vscode.speech.registerSpeechProvider('speech-session-race', {
      provideSpeechToTextSession: () => undefined,
      provideTextToSpeechSession: (token) => {
        speechSessionCount++
        return new Promise((resolve) => {
          token.onCancellationRequested(() => {
            speechSessionCancellationCount++
            setTimeout(() => resolve(new SpeechSessionRaceSample()), 0)
          })
        })
      },
      provideKeywordRecognitionSession: () => undefined,
    }),
  )

  const participant = vscode.chat.createChatParticipant(
    'speech-session-race.participant',
    async (_request, _context, progress) => {
      progress.markdown('A local response used to test cancellation while a speech session is starting.')
    },
  )
  context.subscriptions.push(participant)

  context.subscriptions.push(
    vscode.commands.registerCommand('speechSessionRace.setup', async () => {
      await wait(1000)
      await vscode.commands.executeCommand('workbench.action.chat.newLocalChat')
      await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: '@speech-race test speech session cancellation',
      })
      await wait(2000)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('speechSessionRace.churn', async () => {
      const previousSpeechSessionCount = speechSessionCount
      const previousSpeechSessionCancellationCount = speechSessionCancellationCount
      await vscode.commands.executeCommand('workbench.action.chat.readChatResponseAloud')
      await vscode.commands.executeCommand('workbench.action.speech.stopReadAloud')
      await wait(200)
      if (speechSessionCount === previousSpeechSessionCount) {
        throw new Error('Read Aloud did not create a speech session')
      }
      if (speechSessionCancellationCount === previousSpeechSessionCancellationCount) {
        throw new Error('Stop Read Aloud did not cancel the speech session')
      }
    }),
  )
}
