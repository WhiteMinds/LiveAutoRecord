import { Command } from 'commander'
import { setJsonMode, outputError } from './core/output'
import { createResolveCommand } from './commands/resolve'
import { createListCommand } from './commands/list'
import { createAddCommand } from './commands/add'
import { createRemoveCommand } from './commands/remove'
import { createStatusCommand } from './commands/status'
import { createStartCommand } from './commands/start'
import { createStopCommand } from './commands/stop'
import { createCheckCommand } from './commands/check'
import { createWatchCommand } from './commands/watch'
import { createConfigCommand } from './commands/config'
import { createRecordsCommand } from './commands/records'
import { createAuthCommand } from './commands/auth'

const program = new Command()

program
  .name('lar')
  .description(
    'LiveAutoRecord CLI - Multi-platform live stream auto-recorder\n\nSupported platforms: Bilibili, Douyu, Huya, Douyin',
  )
  .version('0.1.0')
  .option('--json', 'Output in JSON format')
  .showHelpAfterError(true)
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals()
    if (opts.json) {
      setJsonMode(true)
    }
  })

// Phase 1
program.addCommand(createResolveCommand())
program.addCommand(createListCommand())
program.addCommand(createAddCommand())
program.addCommand(createRemoveCommand())

// Phase 2
program.addCommand(createStatusCommand())
program.addCommand(createStartCommand())
program.addCommand(createStopCommand())
program.addCommand(createCheckCommand())

// Phase 3
program.addCommand(createWatchCommand())
program.addCommand(createConfigCommand())
program.addCommand(createRecordsCommand())
program.addCommand(createAuthCommand())

program.parseAsync().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err)
  outputError(msg)
  process.exitCode = 1
})
