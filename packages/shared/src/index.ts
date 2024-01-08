/**
 * 预期上是内部私有包的共享包，而公开包（如 manager）则不应该使用这个包。
 */

export interface Settings {
  notExitOnAllWindowsClosed: boolean
  noticeOnRecordStart: boolean
  debugMode?: boolean
  autoGenerateSRTOnRecordStop?: boolean
  autoRemoveRecordWhenTinySize?: boolean
}

/** electron render 给 web 暴露的 API */
export interface ClientAPI {
  getVersion(): string
}
