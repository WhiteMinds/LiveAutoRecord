import rp from 'request-promise'

export default rp.defaults({
  // proxy: 'http://127.0.0.1:8080',
  // rejectUnauthorized: false,
  timeout: 10e3
})
