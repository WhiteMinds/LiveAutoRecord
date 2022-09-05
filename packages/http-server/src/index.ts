export function startServer() {
  console.log('HTTP server started.')
}

const isDirectlyRun = require.main === module
if (isDirectlyRun) {
  startServer()
}
