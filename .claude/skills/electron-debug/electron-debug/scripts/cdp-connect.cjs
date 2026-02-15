/**
 * Connect to a running Electron app via CDP and capture console logs + screenshot.
 *
 * Usage:
 *   node cdp-connect.js [--port 9222] [--duration 5000] [--screenshot /tmp/electron.png] [--eval "js code"]
 *
 * Requires: playwright (from playwright-skill or globally installed)
 */
const { chromium } = require('playwright')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { port: 9222, duration: 5000, screenshot: null, eval: null }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port') opts.port = parseInt(args[i + 1], 10)
    if (args[i] === '--duration') opts.duration = parseInt(args[i + 1], 10)
    if (args[i] === '--screenshot') opts.screenshot = args[i + 1]
    if (args[i] === '--eval') opts.eval = args[i + 1]
  }
  return opts
}

async function main() {
  const opts = parseArgs()

  // Step 1: Fetch ws:// URL from CDP JSON endpoint
  console.log(`Fetching CDP info from http://localhost:${opts.port} ...`)
  const versionRes = await fetch(`http://localhost:${opts.port}/json/version`)
  const versionInfo = await versionRes.json()
  const wsUrl = versionInfo.webSocketDebuggerUrl
  console.log(`Browser: ${versionInfo.Browser}`)
  console.log(`WebSocket URL: ${wsUrl}\n`)

  // Step 2: Connect via WebSocket
  const browser = await chromium.connectOverCDP(wsUrl)
  const contexts = browser.contexts()
  console.log(`Connected. ${contexts.length} context(s), ${contexts.reduce((n, c) => n + c.pages().length, 0)} page(s) total.\n`)

  // Step 3: Find renderer page (skip devtools://)
  let targetPage = null
  for (const ctx of contexts) {
    for (const page of ctx.pages()) {
      const url = page.url()
      console.log(`  Page: ${url}`)
      if (!url.startsWith('devtools://') && !targetPage) targetPage = page
    }
  }

  if (!targetPage) {
    console.error('\nNo renderer page found!')
    process.exit(1)
  }

  console.log(`\nTarget: ${targetPage.url()}`)
  console.log(`Title:  ${await targetPage.title()}\n`)

  // Step 4: Listen for console messages
  const messages = []
  targetPage.on('console', (msg) => {
    messages.push({ type: msg.type(), text: msg.text() })
  })

  // Step 5: Optionally evaluate JS in the page
  if (opts.eval) {
    console.log(`Evaluating: ${opts.eval}\n`)
    const result = await targetPage.evaluate(opts.eval)
    if (result !== undefined) console.log('Result:', JSON.stringify(result, null, 2))
  }

  // Step 6: Wait to collect console output
  console.log(`Listening for console messages (${opts.duration}ms)...\n`)
  await new Promise((r) => setTimeout(r, opts.duration))

  // Step 7: Print captured messages
  console.log('=== Console Messages ===')
  console.log(`Captured: ${messages.length}\n`)
  for (const m of messages) {
    console.log(`[${m.type.toUpperCase().padEnd(7)}] ${m.text}`)
  }

  // Step 8: Optional screenshot
  if (opts.screenshot) {
    await targetPage.screenshot({ path: opts.screenshot, fullPage: true })
    console.log(`\nScreenshot: ${opts.screenshot}`)
  }

  // Disconnect (don't close the app)
  try { browser.disconnect() } catch {}
  console.log('\nDone.')
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
