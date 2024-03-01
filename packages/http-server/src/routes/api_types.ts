import {
  Recorder,
  RecorderCreateOpts,
  RecorderManagerCreateOpts,
  RecordExtraData,
  RecordHandle,
} from '@autorecord/manager'
import { Settings } from '@autorecord/shared'
import { RecordModel } from '../db'
import { RecorderExtra } from '../manager'

export interface PagedArgs {
  page: number
  pageSize: number
}
export interface PagedResp extends PagedArgs {
  total: number
  totalPage: number
}

export type ClientRecorder = Omit<
  Recorder<RecorderExtra>,
  // TODO: 可以改成排除所有方法 & EmitterProps
  'all' | 'getChannelURL' | 'checkLiveStatusAndRecord' | 'recordHandle' | 'toJSON'
> & {
  channelURL: string
  recordHandle?: Omit<RecordHandle, 'stop'>
}

export type ClientRecord = RecordModel

export namespace API {
  export namespace getRecorders {
    export interface Args extends PagedArgs {}

    export interface Resp extends PagedResp {
      items: ClientRecorder[]
    }
  }

  export namespace getRecorder {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = ClientRecorder
  }

  export namespace addRecorder {
    export type Args = Omit<RecorderCreateOpts, 'id'>

    export type Resp = ClientRecorder
  }

  export namespace updateRecorder {
    export type Args = Pick<
      RecorderCreateOpts,
      'id' | 'remarks' | 'disableAutoCheck' | 'quality' | 'streamPriorities' | 'sourcePriorities'
    >

    export type Resp = ClientRecorder
  }

  export namespace removeRecorder {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = null
  }

  export namespace startRecord {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = ClientRecorder
  }

  export namespace stopRecord {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = ClientRecorder
  }

  export namespace getManager {
    export interface Args {}

    export type Resp = Omit<RecorderManagerCreateOpts, 'providers'>
  }

  export namespace updateManager {
    export type Args = Omit<RecorderManagerCreateOpts, 'providers'>

    export type Resp = Omit<RecorderManagerCreateOpts, 'providers'>
  }

  export namespace resolveChannel {
    export interface Args {
      channelURL: string
    }

    export type Resp = {
      providerId: string
      channelId: string
      owner: string
    } | null
  }

  export namespace getManagerDefault {
    export interface Args {}

    export type Resp = Omit<RecorderManagerCreateOpts, 'providers'>
  }

  export namespace getRecords {
    export interface Args extends PagedArgs {
      recorderId?: Recorder['id']
    }

    export interface Resp extends PagedResp {
      items: ClientRecord[]
    }
  }

  export namespace getRecord {
    export interface Args {
      id: RecordModel['id']
    }

    export type Resp = ClientRecord
  }

  export namespace getRecordExtraData {
    export interface Args {
      id: RecordModel['id']
    }

    export type Resp = RecordExtraData
  }

  export namespace createRecordSRT {
    export interface Args {
      id: RecordModel['id']
    }

    export type Resp = string
  }

  export namespace getSettings {
    export interface Args {}

    export type Resp = Settings
  }

  export namespace setSettings {
    export type Args = Settings

    export type Resp = Settings
  }

  export namespace logMethod {
    export type Args = {
      text: string
    }

    export type Resp = null
  }
}

export interface UpdateRecorder {
  event: 'update_recorder'
  recorder: ClientRecorder
}

export interface AddRecorder {
  event: 'add_recorder'
  recorder: ClientRecorder
}

export interface RemoveRecorder {
  event: 'remove_recorder'
  id: ClientRecorder['id']
}

export interface RecordStart {
  event: 'record_start'
  recorder: ClientRecorder
}

export interface SettingsChange {
  event: 'settings_change'
  settings: Settings
}

export type SSEMessage = UpdateRecorder | AddRecorder | RemoveRecorder | RecordStart | SettingsChange
