process.on('unhandledRejection', (reason, promise) => console.error(reason))
process.on('uncaughtException', (err) => console.error(err))

// TODO: configureLogger('server.log')
