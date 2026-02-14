import type { Recorder, RecordHandle, SerializedRecorder } from '@autorecord/manager'

export interface RecorderExtra {
  createTimestamp: number
}

export interface DatabaseSchema {
  records: RecordModel[]
  recorders: RecorderModel[]
  nextRecorderId: number
}

export interface RecordModel {
  id: RecordHandle['id']
  recorderId: Recorder['id']
  savePath: string
  startTimestamp: number
  stopTimestamp?: number
  stopReason?: string
}

export type RecorderModel = SerializedRecorder<RecorderExtra>

export interface QueryRecordsOpts {
  recorderId?: Recorder['id']
  start?: number
  count?: number
}

export interface ManagerConfig {
  savePathRule: string
  autoRemoveSystemReservedChars: boolean
  autoCheckLiveStatusAndRecord: boolean
  autoCheckInterval: number
  ffmpegOutputArgs: string
}

export const managerConfigKeys: (keyof ManagerConfig)[] = [
  'savePathRule',
  'autoRemoveSystemReservedChars',
  'autoCheckLiveStatusAndRecord',
  'autoCheckInterval',
  'ffmpegOutputArgs',
]
