/**
 * Toggle the CDP remote-debugging-port switch in the Electron main process entry.
 *
 * Usage:
 *   node enable-cdp.js enable [--port 9222]   # Insert the switch
 *   node enable-cdp.js disable                 # Remove the switch
 *
 * Operates on: apps/electron/src/index.ts (relative to project root)
 */
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..')
const ENTRY_FILE = path.join(PROJECT_ROOT, 'apps', 'electron', 'src', 'index.ts')
const MARKER = '// [CDP] Enable remote debugging for Playwright'

function main() {
  const action = process.argv[2]
  if (!action || !['enable', 'disable'].includes(action)) {
    console.error('Usage: node enable-cdp.js <enable|disable> [--port 9222]')
    process.exit(1)
  }

  let port = '9222'
  const portIdx = process.argv.indexOf('--port')
  if (portIdx !== -1) port = process.argv[portIdx + 1]

  let content = fs.readFileSync(ENTRY_FILE, 'utf-8')
  const hasMarker = content.includes(MARKER)

  if (action === 'enable') {
    if (hasMarker) {
      console.log('CDP switch already present. Skipping.')
      return
    }
    // Insert after the __dirname line
    const anchor = "const __dirname = dirname(fileURLToPath(import.meta.url))"
    if (!content.includes(anchor)) {
      console.error('Cannot find anchor line in', ENTRY_FILE)
      process.exit(1)
    }
    const cdpLine = `\n${MARKER}\napp.commandLine.appendSwitch('remote-debugging-port', '${port}')`
    content = content.replace(anchor, anchor + cdpLine)
    fs.writeFileSync(ENTRY_FILE, content, 'utf-8')
    console.log(`Enabled CDP on port ${port} in ${ENTRY_FILE}`)
  }

  if (action === 'disable') {
    if (!hasMarker) {
      console.log('CDP switch not present. Skipping.')
      return
    }
    // Remove the marker line and the appendSwitch line (and surrounding blank lines)
    content = content.replace(
      /\n\/\/ \[CDP\] Enable remote debugging for Playwright\napp\.commandLine\.appendSwitch\('remote-debugging-port', '\d+'\)/,
      ''
    )
    fs.writeFileSync(ENTRY_FILE, content, 'utf-8')
    console.log(`Disabled CDP in ${ENTRY_FILE}`)
  }
}

main()
