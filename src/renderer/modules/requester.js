import rp from 'request-promise'
import uuid4 from 'uuid/v4'
import log from '@/modules/log'

const requester = rp.defaults({
  // proxy: 'http://127.0.0.1:8080',
  // rejectUnauthorized: false,
  timeout: 10e3
})

;['get', 'post'].forEach(method => {
  let origin = requester[method]
  requester[method] = function (...args) {
    const uuid = uuid4()
    log.trace(`Request [${method}][${uuid}]:`, JSON.stringify(args))
    return origin.apply(this, args).then(result => {
      if (result) {
        let body = result.constructor.name === 'IncomingMessage' ? result.body : result
        body = typeof body === 'object' ? JSON.stringify(body) : body
        log.trace(`Result [${method}][${uuid}]:`, body)
      }
      return result
    })
  }
})

export default requester
