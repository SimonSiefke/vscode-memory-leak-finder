const vscode = require('vscode')

// Each run leaks one interval that keeps the extension host busy for 5 ms
// every 100 ms (about 5% of a core) after the scenario has finished.
const BurnMs = 5
const IntervalMs = 100
const MaxBurners = 4

const burners = []

const burn = () => {
  const end = performance.now() + BurnMs
  while (performance.now() < end) {
    // Busy wait on purpose.
  }
}

const run = () => {
  if (burners.length < MaxBurners) {
    burners.push(setInterval(burn, IntervalMs))
  }
}

const cleanup = () => {
  for (const burner of burners.splice(0)) {
    clearInterval(burner)
  }
}

exports.activate = (context) => {
  context.subscriptions.push({ dispose: cleanup })
  context.subscriptions.push(
    vscode.commands.registerCommand('idle-cpu-leaked-interval.run', () => {
      run()
      void vscode.window.showInformationMessage('Idle CPU Leaked Interval: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('idle-cpu-leaked-interval.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Idle CPU Leaked Interval: cleanup complete')
    }),
  )
}

exports.deactivate = cleanup
