import { Observable, Subject } from 'rxjs'
import type { SSEMessage } from '@autorecord/http-server'

// TODO: 暂时用固定值
const baseURL = 'http://localhost:8085/api'

const eventSubject = new Subject<SSEMessage>()

const es = new EventSource(`${baseURL}/events`)
// TODO: 之后再处理
es.onerror = console.error
es.onmessage = (e) => {
  const msg = JSON.parse(e.data) as SSEMessage
  eventSubject.next(msg)
}

export function getServerMessages(): Observable<SSEMessage> {
  return eventSubject
}
