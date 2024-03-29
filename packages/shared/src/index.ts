/**
 * 预期上是内部私有包的共享包，而公开包（如 manager）则不应该使用这个包。
 */

export interface Settings {
  notExitOnAllWindowsClosed: boolean
  noticeOnRecordStart: boolean
  noticeFormat?: string
  debugMode?: boolean
  autoGenerateSRTOnRecordStop?: boolean
  autoRemoveRecordWhenTinySize?: boolean
  locale?: string
  sortMode?: string
}

/** electron render 给 web 暴露的 API */
export interface ClientAPI {
  getVersion(): string
}

export * from './steno'
export * from './jsonfile'
